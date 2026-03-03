import { Repository } from 'typeorm';
import { Holiday } from './holidays.entity';
export declare class HolidaysService {
    private holidaysRepository;
    constructor(holidaysRepository: Repository<Holiday>);
    create(holiday: Partial<Holiday>): Promise<Holiday>;
    findOne(date: Date, region: string): Promise<Holiday | null>;
    isHoliday(date: Date, region: string): Promise<boolean>;
    getHolidaysInRange(startDate: Date, endDate: Date, region: string): Promise<Holiday[]>;
}
