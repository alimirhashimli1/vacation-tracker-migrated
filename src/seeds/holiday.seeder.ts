import { Injectable, Logger } from '@nestjs/common';
import { HolidaysService } from '../holidays/holidays.service';
import { Holiday } from '../holidays/holidays.entity';

interface NagerDateHoliday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    counties: string[] | null;
    launchYear: number | null;
    types: string[];
}

@Injectable()
export class HolidaySeeder {
    private readonly logger = new Logger(HolidaySeeder.name);

    constructor(private readonly holidaysService: HolidaysService) {}

    async seed() {
        this.logger.log('Seeding German holidays...');
        const year = new Date().getFullYear();
        const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/DE`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch holidays: ${response.statusText}`);
            }
            const holidays: NagerDateHoliday[] = await response.json();

            for (const holiday of holidays) {
                const regions = holiday.counties && holiday.counties.length > 0 ? holiday.counties : ['DE'];

                for (const region of regions) {
                    const existingHoliday = await this.holidaysService.findOne(new Date(holiday.date), region);

                    if (!existingHoliday) {
                        const holidayEntity = new Holiday();
                        holidayEntity.date = new Date(holiday.date);
                        holidayEntity.name = holiday.name;
                        holidayEntity.region = region;
                        
                        await this.holidaysService.create(holidayEntity);
                    }
                }
            }

            this.logger.log('Finished seeding holidays.');
        } catch (error) {
            this.logger.error('Error seeding holidays:', error);
        }
    }
}
