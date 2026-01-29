import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req, // Import Req
  ForbiddenException, // Import ForbiddenException
} from '@nestjs/common';
import { Request } from 'express'; // Import Request from express
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto, AbsenceResponseDto } from '../../../../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../../../../shared/update-absence.dto';
import { UpdateAbsenceStatusDto } from '../../../../shared/update-absence-status.dto'; // New import
import { RolesGuard } from '../../../../shared/auth/roles.guard';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { Role } from '../../../../shared/role.enum';
import { JwtAuthGuard } from '../../../../shared/auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: Role;
    // other properties if they exist in your JWT payload
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('absences')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  async create(
    @Req() req: AuthenticatedRequest, // Inject Request object
    @Body() createAbsenceDto: CreateAbsenceDto,
  ): Promise<AbsenceResponseDto> {
    const authenticatedUser = req.user;

    // Rule: EMPLOYEE can create absences for themselves only
    if (authenticatedUser.role === Role.Employee && authenticatedUser.userId !== createAbsenceDto.userId) {
      throw new ForbiddenException('Employees can only create absence requests for themselves.');
    }

    // ADMIN / SUPERADMIN can create for others (already handled by @Roles decorator and the check above)
    // No explicit check needed here for ADMIN/SUPERADMIN as they are allowed.

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
