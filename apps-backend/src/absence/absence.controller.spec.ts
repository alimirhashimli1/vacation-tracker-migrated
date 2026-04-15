import { Test, TestingModule } from '@nestjs/testing';
import { AbsenceController } from './absence.controller';
import { AbsenceService } from './absence.service';
import { Role } from '../shared/role.enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AbsenceType } from '../shared/absence-type.enum';
import { AbsenceStatus } from '../shared/absence-status.enum';

describe('AbsenceController', () => {
  let controller: AbsenceController;
  let service: AbsenceService;

  const mockAbsenceResponse = {
    id: 'absence-id',
    userId: 'user-id',
    startDate: '2023-12-01T00:00:00.000Z',
    endDate: '2023-12-05T00:00:00.000Z',
    type: AbsenceType.VACATION,
    status: AbsenceStatus.PENDING,
    requestedDays: 3,
    approvedDays: 0,
    totalHours: 24,
    cost: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbsenceController],
      providers: [
        {
          provide: AbsenceService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AbsenceController>(AbsenceController);
    service = module.get<AbsenceService>(AbsenceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should allow an employee to create their own absence', async () => {
      const createDto = { userId: 'user-id', startDate: '2023-12-01', endDate: '2023-12-05', type: AbsenceType.VACATION, totalHours: 24, cost: 0 };
      const req = { user: { userId: 'user-id', role: Role.Employee } } as any;
      (service.create as jest.Mock).mockResolvedValue(mockAbsenceResponse);

      const result = await controller.create(req, createDto);
      expect(result).toEqual(mockAbsenceResponse);
    });

    it('should throw ForbiddenException if employee creates absence for someone else', async () => {
      const createDto = { userId: 'other-user-id', startDate: '2023-12-01', endDate: '2023-12-05', type: AbsenceType.VACATION, totalHours: 24, cost: 0 };
      const req = { user: { userId: 'user-id', role: Role.Employee } } as any;

      await expect(controller.create(req, createDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should allow an employee to view their own absence', async () => {
      const req = { user: { userId: 'user-id', role: Role.Employee } } as any;
      (service.findOne as jest.Mock).mockResolvedValue(mockAbsenceResponse);

      const result = await controller.findOne('absence-id', req);
      expect(result).toEqual(mockAbsenceResponse);
    });

    it('should allow an Admin to view any absence', async () => {
      const req = { user: { userId: 'admin-id', role: Role.Admin } } as any;
      (service.findOne as jest.Mock).mockResolvedValue(mockAbsenceResponse);

      const result = await controller.findOne('absence-id', req);
      expect(result).toEqual(mockAbsenceResponse);
    });

    it('should throw ForbiddenException if employee views someone else absence', async () => {
      const req = { user: { userId: 'other-user-id', role: Role.Employee } } as any;
      (service.findOne as jest.Mock).mockResolvedValue(mockAbsenceResponse);

      await expect(controller.findOne('absence-id', req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow an Admin to update an absence', async () => {
      const req = { user: { userId: 'admin-id', role: Role.Admin } } as any;
      const updateDto = { totalHours: 10 };
      (service.update as jest.Mock).mockResolvedValue({ ...mockAbsenceResponse, totalHours: 10 });

      const result = await controller.update('absence-id', updateDto);
      expect(result.totalHours).toBe(10);
    });
  });

  describe('remove', () => {
    it('should allow an Admin to remove an absence', async () => {
      (service.remove as jest.Mock).mockResolvedValue(undefined);

      await controller.remove('absence-id');
      expect(service.remove).toHaveBeenCalledWith('absence-id');
    });
  });
});
