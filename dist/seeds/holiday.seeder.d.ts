import { HolidaysService } from '../holidays/holidays.service';
export declare class HolidaySeeder {
    private readonly holidaysService;
    private readonly logger;
    constructor(holidaysService: HolidaysService);
    seed(): Promise<void>;
}
