import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from '../shared/create-invitation.dto';
import { RolesGuard } from '../shared/auth/roles.guard';
import { Roles } from '../shared/auth/roles.decorator';
import { Public } from '../shared/auth/public.decorator';
import { Role } from '../shared/role.enum';
import { Response } from 'express';

@UseGuards(RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(@Body() createInvitationDto: CreateInvitationDto, @Res() res: Response, @Req() req: any) {
    await this.invitationsService.createInvitation(
      createInvitationDto.email,
      createInvitationDto.role,
      req.user.id, // Pass the ID of the user creating the invitation
    );
    return res.status(201).json({
      message: 'Invitation created successfully',
    });
  }
}
