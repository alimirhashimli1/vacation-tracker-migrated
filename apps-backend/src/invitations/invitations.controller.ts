import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from '../shared/create-invitation.dto';
import { RolesGuard } from '../shared/auth/roles.guard';
import { Roles } from '../shared/auth/roles.decorator';
import { Public } from '../shared/auth/public.decorator';
import { Role } from '../shared/role.enum';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import JwtAuthGuard

@UseGuards(JwtAuthGuard, RolesGuard) // Add JwtAuthGuard before RolesGuard
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(@Body() createInvitationDto: CreateInvitationDto, @Res() res: Response, @Req() req: any) {
    const { invitation, plainToken } = await this.invitationsService.createInvitation(
      createInvitationDto.email,
      createInvitationDto.role,
      req.user.id, // Pass the ID of the user creating the invitation
    );
    return res.status(201).json({
      message: 'Invitation created successfully',
      invitationId: invitation.id,
      plainToken: plainToken, // Include the plain token in the response
    });
  }
}
