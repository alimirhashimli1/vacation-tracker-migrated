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
import { RolesGuard } from '../../../../shared/auth/roles.guard';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { Role } from '../../../../shared/role.enum';
import { JwtAuthGuard } from '../../../../shared/auth/jwt-auth.guard'; // Assuming global guards are active

@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT and Roles guards
@Controller('absences') // Changed to 'absences'
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin) // Employees can request absences
  async create(@Body() createAbsenceDto: CreateAbsenceDto): Promise<AbsenceResponseDto> {
    return this.absenceService.create(createAbsenceDto);
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin) // Only Admins and SuperAdmins can view all absences
  async findAll(): Promise<AbsenceResponseDto[]> {
    return this.absenceService.findAll();
  }

  @Get(':id')
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin) // Employees can view their own, Admins/SuperAdmins any
  async findOne(@Param('id') id: string): Promise<AbsenceResponseDto> {
    // TODO: Add logic to ensure Employee only views their own absence
    return this.absenceService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin) // Only Admins and SuperAdmins can update absences
  async update(@Param('id') id: string, @Body() updateAbsenceDto: UpdateAbsenceDto): Promise<AbsenceResponseDto> {
    return this.absenceService.update(id, updateAbsenceDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin) // Only Admins and SuperAdmins can delete absences
  async remove(@Param('id') id: string): Promise<void> {
    return this.absenceService.remove(id);
  }
}
