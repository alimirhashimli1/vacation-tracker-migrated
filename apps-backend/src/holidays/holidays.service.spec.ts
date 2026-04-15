import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { HolidaysService } from './holidays.service';
import { Holiday } from './holidays.entity';

const mockHoliday = {
  id: 'some-uuid',
  date: new Date('2023-12-25'),
  name: 'Christmas',
  region: 'DE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('HolidaysService', () => {
  let service: HolidaysService;
  let repository: Repository<Holiday>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidaysService,
        {
          provide: getRepositoryToken(Holiday),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HolidaysService>(HolidaysService);
    repository = module.get<Repository<Holiday>>(getRepositoryToken(Holiday));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new holiday', async () => {
      const holidayData = { date: new Date('2023-12-25'), name: 'Christmas', region: 'DE' };
      (repository.create as jest.Mock).mockReturnValue(mockHoliday);
      (repository.save as jest.Mock).mockResolvedValue(mockHoliday);

      const result = await service.create(holidayData);

      expect(repository.create).toHaveBeenCalledWith(holidayData);
      expect(repository.save).toHaveBeenCalledWith(mockHoliday);
      expect(result).toEqual(mockHoliday);
    });
  });

  describe('findOne', () => {
    it('should find a holiday by date and region', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockHoliday);
      const date = new Date('2023-12-25');
      const region = 'DE';

      const result = await service.findOne(date, region);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { date, region } });
      expect(result).toEqual(mockHoliday);
    });

    it('should return null if no holiday found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      const date = new Date('2023-12-26');
      const region = 'DE';

      const result = await service.findOne(date, region);

      expect(result).toBeNull();
    });
  });

  describe('isHoliday', () => {
    it('should return true if holiday exists for specific region', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockHoliday);
      const date = new Date('2023-12-25');
      const region = 'BW'; // Assuming specific region

      const result = await service.isHoliday(date, region);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: [
          { date, region },
          { date, region: 'DE' },
        ],
      });
      expect(result).toBe(true);
    });

    it('should return false if no holiday exists', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      const date = new Date('2023-12-26');
      const region = 'BW';

      const result = await service.isHoliday(date, region);

      expect(result).toBe(false);
    });
  });

  describe('getHolidaysInRange', () => {
    it('should return holidays within range for region and DE', async () => {
      const holidays = [mockHoliday];
      (repository.find as jest.Mock).mockResolvedValue(holidays);
      const startDate = new Date('2023-12-01');
      const endDate = new Date('2023-12-31');
      const region = 'BW';

      const result = await service.getHolidaysInRange(startDate, endDate, region);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          date: Between(startDate, endDate),
          region: In([region, 'DE']),
        },
        order: {
          date: 'ASC',
        },
      });
      expect(result).toEqual(holidays);
    });
  });
});
