import { Module } from '@nestjs/common';
import { AbsenceController } from './absence.controller';
import { AbsenceService } from './absence.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Absence } from './absence.entity';
import { DateUtilsModule } from '../utils/date.utils.module';
import { UsersModule } from '../users/users.module';
import { AbsenceBalanceService } from './absence-balance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence]),
    DateUtilsModule,
    UsersModule,
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService, AbsenceBalanceService],
  exports: [AbsenceService, AbsenceBalanceService],
})
export class AbsenceModule {}