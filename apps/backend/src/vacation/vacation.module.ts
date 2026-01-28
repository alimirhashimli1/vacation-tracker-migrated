import { Module } from '@nestjs/common';
import { VacationController } from './vacation.controller';
import { VacationService } from './vacation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vacation } from './vacation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vacation])],
  controllers: [VacationController],
  providers: [VacationService],
  exports: [VacationService]
})
export class VacationModule {}