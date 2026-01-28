import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateVacationDto,
  VacationResponseDto,
} from '../../../../shared/create-vacation.dto';
import { VacationService } from './vacation.service';

@Controller('vacations')
export class VacationController {
  constructor(private readonly vacationService: VacationService) {}

  @Post()
  async createVacation(
    @Body() createVacationDto: CreateVacationDto
  ): Promise<VacationResponseDto> {
    return this.vacationService.create(createVacationDto);
  }

  @Get()
  async findAll(): Promise<VacationResponseDto[]> {
    return this.vacationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VacationResponseDto> {
    return this.vacationService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<VacationResponseDto> {
    return this.vacationService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.vacationService.remove(id);
  }
}