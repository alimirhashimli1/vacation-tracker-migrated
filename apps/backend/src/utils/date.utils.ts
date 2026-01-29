import { Injectable } from '@nestjs/common';
import { HolidaysService } from '../holidays/holidays.service';

@Injectable()
export class DateUtils {
  constructor(private readonly holidaysService: HolidaysService) {}

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
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
