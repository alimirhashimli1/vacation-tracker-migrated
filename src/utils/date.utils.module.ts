import { Module } from '@nestjs/common';
import { HolidaysModule } from '../holidays/holidays.module';
import { DateUtils } from './date.utils';

@Module({
  imports: [HolidaysModule],
  providers: [DateUtils],
  exports: [DateUtils],
})
export class DateUtilsModule {}
