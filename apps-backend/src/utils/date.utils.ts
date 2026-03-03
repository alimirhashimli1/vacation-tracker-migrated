import { Injectable } from '@nestjs/common';
import { parseISO, isValid, format, isWeekend, getDay, isBefore, isAfter, isWithinInterval, addDays } from 'date-fns';
import { de, enGB } from 'date-fns/locale'; // Import locales
import { HolidaysService } from '../holidays/holidays.service'; // Import HolidaysService

@Injectable()
export class DateUtils {
  constructor(private readonly holidaysService: HolidaysService) {} // Inject HolidaysService

  // New method to parse date strings robustly
  parseDate(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    // Handle potential non-string inputs gracefully, though type guard should ideally cover this.
    if (typeof dateInput !== 'string') {
        throw new Error(`Invalid date input type: ${typeof dateInput}. Expected string or Date.`);
    }
    const parsedDate = parseISO(dateInput); // Use parseISO for ISO 8601 strings
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid date format for: ${dateInput}`);
    }
    return parsedDate;
  }

  isWeekend(date: Date): boolean {
    return isWeekend(date); // Use date-fns's isWeekend
  }

  async getWorkingDaysBetween(startDate: Date, endDate: Date, region: string): Promise<number> {
    let workingDays = 0;
    const currentDate = new Date(startDate.toISOString());

    while (currentDate <= endDate) {
      if (!this.isWeekend(currentDate) && !(await this.holidaysService.isHoliday(currentDate, region))) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }
}

