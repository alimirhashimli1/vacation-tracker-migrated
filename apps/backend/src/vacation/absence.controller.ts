import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto, AbsenceResponseDto } from '../../../../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../../../../shared/update-absence.dto';
import { UpdateAbsenceStatusDto } from '../../../../shared/update-absence-status.dto'; // New import
import { RolesGuard } from '../../../../shared/auth/roles.guard';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { Role } from '../../../../shared/role.enum';
import { JwtAuthGuard } from '../../../../shared/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('absences')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  async create(@Body() createAbsenceDto: CreateAbsenceDto): Promise<AbsenceResponseDto> {
    return this.absenceService.create(createAbsenceDto);
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  async findAll(): Promise<AbsenceResponseDto[]> {
    return this.absenceService.findAll();
  }

  @Get(':id')
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  async findOne(@Param('id') id: string): Promise<AbsenceResponseDto> {
    // TODO: Add logic to ensure Employee only views their own absence
    return this.absenceService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  async update(@Param('id') id: string, @Body() updateAbsenceDto: UpdateAbsenceDto): Promise<AbsenceResponseDto> {
    return this.absenceService.update(id, updateAbsenceDto);
  }

  @Patch(':id/status') // New endpoint for status update
  @Roles(Role.Admin, Role.SuperAdmin)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateAbsenceStatusDto: UpdateAbsenceStatusDto,
  ): Promise<AbsenceResponseDto> {
    return this.absenceService.update(id, updateAbsenceStatusDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.absenceService.remove(id);
  }
}
