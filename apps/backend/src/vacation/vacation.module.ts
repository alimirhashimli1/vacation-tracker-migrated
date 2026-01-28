import { Module } from '@nestjs/common';
import { AbsenceController } from './vacation.controller';
import { AbsenceService } from './absence.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Absence } from './vacation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Absence])],
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService]
})
export class AbsenceModule {}