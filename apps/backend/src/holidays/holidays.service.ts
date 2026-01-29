import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Holiday } from './holidays.entity';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private holidaysRepository: Repository<Holiday>,
  ) {}

  async create(holiday: Partial<Holiday>): Promise<Holiday> {
    const newHoliday = this.holidaysRepository.create(holiday);
    return this.holidaysRepository.save(newHoliday);
  }

  async findOne(date: Date, region: string): Promise<Holiday | null> {
    return this.holidaysRepository.findOne({ where: { date, region } });
  }

  async isHoliday(date: Date, region: string): Promise<boolean> {
    const holiday = await this.holidaysRepository.findOne({
      where: [
        { date, region },
        { date, region: 'DE' }, // Also check for nationwide holidays
      ],
    });
    return !!holiday;
  }

  async getHolidaysInRange(startDate: Date, endDate: Date, region: string): Promise<Holiday[]> {
    return this.holidaysRepository.find({
      where: {
        date: Between(startDate, endDate),
        region: In([region, 'DE']), // Check for user's region and nationwide holidays
      },
      order: {
        date: 'ASC',
      }
    });
  }
}
