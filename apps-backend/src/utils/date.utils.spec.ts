import { Test, TestingModule } from '@nestjs/testing';
import { DateUtils } from './date.utils';
import { HolidaysService } from '../holidays/holidays.service';

describe('DateUtils', () => {
  let dateUtils: DateUtils;
  let holidaysService: HolidaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DateUtils,
        {
          provide: HolidaysService,
          useValue: {
            isHoliday: jest.fn(),
          },
        },
      ],
    }).compile();

    dateUtils = module.get<DateUtils>(DateUtils);
    holidaysService = module.get<HolidaysService>(HolidaysService);
  });

  it('should be defined', () => {
    expect(dateUtils).toBeDefined();
  });

  describe('parseDate', () => {
    it('should return the same date if a Date object is passed', () => {
      const date = new Date();
      expect(dateUtils.parseDate(date)).toBe(date);
    });

    it('should parse a valid ISO date string', () => {
      const dateStr = '2023-12-25T00:00:00Z';
      const parsed = dateUtils.parseDate(dateStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toContain('2023-12-25');
    });

    it('should throw an error for an invalid date string', () => {
      expect(() => dateUtils.parseDate('invalid-date')).toThrow('Invalid date format');
    });

    it('should throw an error for non-string, non-date inputs', () => {
      expect(() => dateUtils.parseDate(123 as any)).toThrow('Invalid date input type');
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday and Sunday', () => {
      const saturday = new Date('2023-12-23'); // Saturday
      const sunday = new Date('2023-12-24'); // Sunday
      expect(dateUtils.isWeekend(saturday)).toBe(true);
      expect(dateUtils.isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2023-12-25'); // Monday
      expect(dateUtils.isWeekend(monday)).toBe(false);
    });
  });

  describe('getWorkingDaysBetween', () => {
    it('should count only working days (no weekends, no holidays)', async () => {
      const startDate = new Date('2023-12-22'); // Friday
      const endDate = new Date('2023-12-26'); // Tuesday
      // 22 (Fri), 23 (Sat), 24 (Sun), 25 (Mon), 26 (Tue)
      // Fri: Working
      // Sat: Weekend
      // Sun: Weekend
      // Mon: Holiday
      // Tue: Working
      
      (holidaysService.isHoliday as jest.Mock).mockImplementation(async (date: Date) => {
        return date.toISOString().startsWith('2023-12-25'); // Christmas is holiday
      });

      const result = await dateUtils.getWorkingDaysBetween(startDate, endDate, 'DE');
      expect(result).toBe(2); // Fri and Tue
    });

    it('should return 0 if all days are weekends or holidays', async () => {
        const startDate = new Date('2023-12-23'); // Saturday
        const endDate = new Date('2023-12-24'); // Sunday
        (holidaysService.isHoliday as jest.Mock).mockResolvedValue(false);
  
        const result = await dateUtils.getWorkingDaysBetween(startDate, endDate, 'DE');
        expect(result).toBe(0);
      });
  });
});
