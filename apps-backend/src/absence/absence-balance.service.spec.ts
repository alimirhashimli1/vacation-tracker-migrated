import { Test, TestingModule } from '@nestjs/testing';
import { AbsenceBalanceService } from './absence-balance.service';
import { AbsenceService } from './absence.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
import { NotFoundException } from '@nestjs/common';
import { AbsenceStatus } from '../shared/absence-status.enum';
import { AbsenceType } from '../shared/absence-type.enum';

describe('AbsenceBalanceService', () => {
  let service: AbsenceBalanceService;
  let absenceService: AbsenceService;
  let usersService: UsersService;

  const mockAbsenceService = {
    getApprovedVacationsForYear: jest.fn(),
  };

  const mockDateUtils = {};

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsenceBalanceService,
        { provide: AbsenceService, useValue: mockAbsenceService },
        { provide: DateUtils, useValue: mockDateUtils },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AbsenceBalanceService>(AbsenceBalanceService);
    absenceService = module.get<AbsenceService>(AbsenceService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getYearlyAllowance', () => {
    const userId = 'user-1';

    it('should return 30 if year is BASE_YEAR (2024)', async () => {
      const allowance = await service.getYearlyAllowance(userId, 2024);
      expect(allowance).toBe(30);
    });

    it('should include carryover capped at 5 days if year > 2024', async () => {
      // Mock remaining days from 2024 to be 10
      jest.spyOn(service, 'getRemainingVacationDays').mockResolvedValueOnce(10);
      
      const allowance = await service.getYearlyAllowance(userId, 2025);
      
      // 30 base + 5 capped carryover = 35
      expect(allowance).toBe(35);
      expect(service.getRemainingVacationDays).toHaveBeenCalledWith(userId, 2024);
    });

    it('should include exact carryover if less than 5 days', async () => {
      // Mock remaining days from 2024 to be 3
      jest.spyOn(service, 'getRemainingVacationDays').mockResolvedValueOnce(3);
      
      const allowance = await service.getYearlyAllowance(userId, 2025);
      
      // 30 base + 3 carryover = 33
      expect(allowance).toBe(33);
    });

    it('should not include negative carryover', async () => {
      // Mock remaining days from 2024 to be -2 (overused)
      jest.spyOn(service, 'getRemainingVacationDays').mockResolvedValueOnce(-2);
      
      const allowance = await service.getYearlyAllowance(userId, 2025);
      
      // 30 base + 0 carryover = 30
      expect(allowance).toBe(30);
    });
  });

  describe('getUsedVacationDays', () => {
    const userId = 'user-1';
    const year = 2025;

    it('should calculate total used vacation days from approved absences', async () => {
      mockUsersService.findOneById.mockResolvedValue({ id: userId });
      mockAbsenceService.getApprovedVacationsForYear.mockResolvedValue([
        { approvedDays: 5 },
        { approvedDays: 3 },
        { approvedDays: 2 },
      ]);

      const usedDays = await service.getUsedVacationDays(userId, year);

      expect(usedDays).toBe(10);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(userId);
      expect(mockAbsenceService.getApprovedVacationsForYear).toHaveBeenCalledWith(userId, year);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.findOneById.mockResolvedValue(null);

      await expect(service.getUsedVacationDays(userId, year)).rejects.toThrow(NotFoundException);
    });

    it('should return 0 if no approved absences are found', async () => {
      mockUsersService.findOneById.mockResolvedValue({ id: userId });
      mockAbsenceService.getApprovedVacationsForYear.mockResolvedValue([]);

      const usedDays = await service.getUsedVacationDays(userId, year);

      expect(usedDays).toBe(0);
    });
  });

  describe('getRemainingVacationDays', () => {
    const userId = 'user-1';
    const year = 2025;

    it('should return remaining days (allowance - used)', async () => {
      jest.spyOn(service, 'getYearlyAllowance').mockResolvedValue(30);
      jest.spyOn(service, 'getUsedVacationDays').mockResolvedValue(12);

      const remaining = await service.getRemainingVacationDays(userId, year);

      expect(remaining).toBe(18);
    });
  });
});
