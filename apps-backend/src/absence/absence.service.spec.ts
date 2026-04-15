import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbsenceService } from './absence.service';
import { Absence } from './absence.entity';
import { AbsenceBalanceService } from './absence-balance.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
import { DataSource, Repository, QueryRunner, Between } from 'typeorm';
import { AbsenceType } from '../shared/absence-type.enum';
import { AbsenceStatus } from '../shared/absence-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AbsenceService', () => {
  let service: AbsenceService;
  let absenceRepository: Repository<Absence>;
  let balanceService: AbsenceBalanceService;
  let dateUtils: DateUtils;
  let usersService: UsersService;
  let dataSource: DataSource;

  const mockAbsenceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockBalanceService = {
    getYearlyAllowance: jest.fn(),
    getUsedVacationDays: jest.fn(),
  };

  const mockDateUtils = {
    getWorkingDaysBetween: jest.fn(),
    parseDate: jest.fn(),
  };

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    isTransactionActive: false,
    manager: {
      findOneBy: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsenceService,
        { provide: getRepositoryToken(Absence), useValue: mockAbsenceRepository },
        { provide: AbsenceBalanceService, useValue: mockBalanceService },
        { provide: DateUtils, useValue: mockDateUtils },
        { provide: UsersService, useValue: mockUsersService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AbsenceService>(AbsenceService);
    absenceRepository = module.get<Repository<Absence>>(getRepositoryToken(Absence));
    balanceService = module.get<AbsenceBalanceService>(AbsenceBalanceService);
    dateUtils = module.get<DateUtils>(DateUtils);
    usersService = module.get<UsersService>(UsersService);
    dataSource = module.get<DataSource>(DataSource);
    
    // Reset transaction state
    mockQueryRunner.isTransactionActive = false;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      userId: 'user-1',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      type: AbsenceType.VACATION,
      totalHours: 24,
      cost: 0,
    };

    const mockUser = { id: 'user-1', region: 'DE' };

    it('should successfully create an absence', async () => {
      mockUsersService.findOneById.mockResolvedValue(mockUser);
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      mockDateUtils.parseDate.mockImplementation((d) => new Date(d));
      mockAbsenceRepository.find.mockResolvedValue([]);
      mockBalanceService.getYearlyAllowance.mockResolvedValue(25);
      mockBalanceService.getUsedVacationDays.mockResolvedValue(5);
      
      const savedAbsence = {
        ...createDto,
        id: 'uuid',
        status: AbsenceStatus.PENDING,
        requestedDays: 3,
        approvedDays: 0,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
      };
      
      mockAbsenceRepository.create.mockReturnValue(savedAbsence);
      mockAbsenceRepository.save.mockResolvedValue(savedAbsence);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.requestedDays).toBe(3);
      expect(mockAbsenceRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if startDate is after endDate', async () => {
      const invalidDto = { ...createDto, startDate: '2025-01-05', endDate: '2025-01-01' };
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vacation spans multiple years', async () => {
      const invalidDto = { ...createDto, startDate: '2025-12-30', endDate: '2026-01-02' };
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if requestedDays is 0', async () => {
      mockUsersService.findOneById.mockResolvedValue(mockUser);
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(0);
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vacation balance exceeded', async () => {
      mockUsersService.findOneById.mockResolvedValue(mockUser);
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(20);
      mockDateUtils.parseDate.mockImplementation((d) => new Date(d));
      mockAbsenceRepository.find.mockResolvedValue([]);
      mockBalanceService.getYearlyAllowance.mockResolvedValue(25);
      mockBalanceService.getUsedVacationDays.mockResolvedValue(10); // 15 left, 20 requested

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dates overlap with existing approved absence', async () => {
      mockUsersService.findOneById.mockResolvedValue(mockUser);
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      mockDateUtils.parseDate.mockImplementation((d) => new Date(d));
      
      mockAbsenceRepository.find.mockResolvedValue([
        {
          startDate: new Date('2025-01-02'),
          endDate: new Date('2025-01-04'),
          status: AbsenceStatus.APPROVED,
        },
      ]);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = {
      status: AbsenceStatus.APPROVED,
      approvedDays: 3,
    };
    const existingAbsence = {
      id: 'abs-1',
      userId: 'user-1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
      type: AbsenceType.VACATION,
      status: AbsenceStatus.PENDING,
      requestedDays: 3,
      approvedDays: 0,
    };

    beforeEach(() => {
      mockQueryRunner.isTransactionActive = true;
      mockDateUtils.parseDate.mockImplementation((d) => new Date(d));
    });

    it('should successfully update an absence and commit transaction', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      mockQueryRunner.manager.find.mockResolvedValue([]); // No overlaps
      mockBalanceService.getYearlyAllowance.mockResolvedValue(25);
      mockBalanceService.getUsedVacationDays.mockResolvedValue(5);
      
      const updatedAbsence = { ...existingAbsence, ...updateDto };
      mockQueryRunner.manager.save.mockResolvedValue(updatedAbsence);

      const result = await service.update('abs-1', updateDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(AbsenceStatus.APPROVED);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if absence not found', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(null);
      await expect(service.update('abs-1', updateDto)).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when changing status of terminal absence', async () => {
      const approvedAbsence = { ...existingAbsence, status: AbsenceStatus.APPROVED };
      mockQueryRunner.manager.findOneBy.mockResolvedValue(approvedAbsence);
      
      await expect(service.update('abs-1', { status: AbsenceStatus.REJECTED })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if approvedDays exceeds requestedDays', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      
      await expect(service.update('abs-1', { status: AbsenceStatus.APPROVED, approvedDays: 5 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if approvedDays is negative', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      
      await expect(service.update('abs-1', { status: AbsenceStatus.APPROVED, approvedDays: -1 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startDate > endDate during update', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      await expect(service.update('abs-1', { startDate: '2025-01-10', endDate: '2025-01-01' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vacation spans multiple years during update', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      await expect(service.update('abs-1', { startDate: '2025-12-31', endDate: '2026-01-01' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if overlap found with another absence during update', async () => {
      mockQueryRunner.manager.findOneBy.mockResolvedValue(existingAbsence);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(3);
      
      mockQueryRunner.manager.find.mockResolvedValue([
        {
          id: 'other-abs',
          userId: 'user-1',
          startDate: new Date('2025-01-02'),
          endDate: new Date('2025-01-04'),
          status: AbsenceStatus.APPROVED,
        },
      ]);

      await expect(service.update('abs-1', { startDate: '2025-01-01', endDate: '2025-01-05' })).rejects.toThrow(BadRequestException);
    });

    it('should correctly handle balance when updating an already approved vacation', async () => {
      const alreadyApproved = {
        ...existingAbsence,
        status: AbsenceStatus.APPROVED,
        approvedDays: 3,
      };
      mockQueryRunner.manager.findOneBy.mockResolvedValue(alreadyApproved);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(5); // Requesting more days
      mockQueryRunner.manager.find.mockResolvedValue([{ ...alreadyApproved }]); // Overlap with self should be ignored
      
      mockBalanceService.getYearlyAllowance.mockResolvedValue(25);
      mockBalanceService.getUsedVacationDays.mockResolvedValue(10); // Includes the 3 days from alreadyApproved
      
      // If we increase to 5 days:
      // usedExcludingCurrent = 10 - 3 = 7
      // available = 25 - 7 = 18
      // 5 <= 18 (Success)

      const updateDtoLarge = { approvedDays: 5 };
      mockQueryRunner.manager.save.mockImplementation((entity, data) => Promise.resolve(data));

      const result = await service.update('abs-1', updateDtoLarge);
      expect(result.approvedDays).toBe(5);
    });

    it('should throw BadRequestException if updated vacation exceeds balance', async () => {
      const alreadyApproved = {
        ...existingAbsence,
        status: AbsenceStatus.APPROVED,
        approvedDays: 3,
      };
      mockQueryRunner.manager.findOneBy.mockResolvedValue(alreadyApproved);
      mockUsersService.findOneById.mockResolvedValue({ id: 'user-1', region: 'DE' });
      mockDateUtils.getWorkingDaysBetween.mockReturnValue(20);
      mockQueryRunner.manager.find.mockResolvedValue([{ ...alreadyApproved }]);
      
      mockBalanceService.getYearlyAllowance.mockResolvedValue(25);
      mockBalanceService.getUsedVacationDays.mockResolvedValue(10); // Includes 3 days
      
      // usedExcludingCurrent = 10 - 3 = 7
      // available = 25 - 7 = 18
      // 20 > 18 (Failure)

      await expect(service.update('abs-1', { approvedDays: 20 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all absences', async () => {
      const absences = [
        { id: '1', startDate: new Date(), endDate: new Date() },
        { id: '2', startDate: new Date(), endDate: new Date() },
      ];
      mockAbsenceRepository.find.mockResolvedValue(absences);
      mockDateUtils.parseDate.mockReturnValue(new Date());

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockAbsenceRepository.find).toHaveBeenCalled();
    });
  });

  describe('getApprovedVacationsForYear', () => {
    it('should return approved vacations for a user and year', async () => {
      const year = 2025;
      const userId = 'user-1';
      const absences = [{ id: '1', userId, status: AbsenceStatus.APPROVED, type: AbsenceType.VACATION }];
      mockAbsenceRepository.find.mockResolvedValue(absences);

      const result = await service.getApprovedVacationsForYear(userId, year);

      expect(result).toEqual(absences);
      expect(mockAbsenceRepository.find).toHaveBeenCalledWith({
        where: {
          userId,
          status: AbsenceStatus.APPROVED,
          type: AbsenceType.VACATION,
          startDate: Between(new Date(year, 0, 1), new Date(year, 11, 31)),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an absence if found', async () => {
      const absence = { id: '1', startDate: new Date(), endDate: new Date() };
      mockAbsenceRepository.findOneBy.mockResolvedValue(absence);
      mockDateUtils.parseDate.mockReturnValue(new Date());

      const result = await service.findOne('1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockAbsenceRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an absence', async () => {
      mockAbsenceRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('1');
      expect(mockAbsenceRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if nothing affected', async () => {
      mockAbsenceRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
