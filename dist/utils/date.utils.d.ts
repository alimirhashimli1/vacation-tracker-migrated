import { HolidaysService } from '../holidays/holidays.service';
export declare class DateUtils {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    parseDate(dateInput: string | Date): Date;
    isWeekend(date: Date): boolean;
    getWorkingDaysBetween(startDate: Date, endDate: Date, region: string): Promise<number>;
}
