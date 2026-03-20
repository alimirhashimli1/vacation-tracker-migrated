import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Holiday } from './holidays.entity';
import { format } from 'date-fns';

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
    const dateStr = format(date, 'yyyy-MM-dd');
    return this.holidaysRepository.findOne({ where: { date: dateStr as any, region } });
  }

  async isHoliday(date: Date, region: string): Promise<boolean> {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = await this.holidaysRepository.findOne({
      where: [
        { date: dateStr as any, region },
        { date: dateStr as any, region: 'DE' }, // Also check for nationwide holidays
      ],
    });
    return !!holiday;
  }

  async getHolidaysInRange(startDate: Date, endDate: Date, region: string): Promise<Holiday[]> {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    return this.holidaysRepository.find({
      where: {
        date: Between(startStr as any, endStr as any),
        region: In([region, 'DE']), // Check for user's region and nationwide holidays
      },
      order: {
        date: 'ASC',
      }
    });
  }
}
