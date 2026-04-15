import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { Holiday } from './holidays.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../shared/auth/roles.guard';
import { Roles } from '../shared/auth/roles.decorator';
import { Role } from '../shared/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  async getHolidays(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('region') region: string = 'DE',
  ): Promise<Holiday[]> {
    return this.holidaysService.getHolidaysInRange(
      new Date(start),
      new Date(end),
      region,
    );
  }

  @Get('is-holiday')
  async isHoliday(
    @Query('date') date: string,
    @Query('region') region: string = 'DE',
  ): Promise<{ isHoliday: boolean }> {
    const result = await this.holidaysService.isHoliday(new Date(date), region);
    return { isHoliday: result };
  }

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  async create(@Body() holiday: Partial<Holiday>): Promise<Holiday> {
    return this.holidaysService.create(holiday);
  }
}
