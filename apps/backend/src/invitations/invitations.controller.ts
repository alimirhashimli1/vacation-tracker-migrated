import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from '../../../../shared/create-invitation.dto';
import { AcceptInvitationDto } from '../../../../shared/accept-invitation.dto'; // Import AcceptInvitationDto
import { RolesGuard } from '../../../../shared/auth/roles.guard';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { Public } from '../../../../shared/auth/public.decorator'; // Import Public decorator
import { Role } from '../../../../shared/role.enum';
import { Response } from 'express';

@UseGuards(RolesGuard)
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
      invitationToken: plainToken, // Return the plain (unhashed) token for the invitation link
      expiresAt: invitation.expiresAt,
    });
  }

  @Public()
  @Post('accept')
  async acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto, @Res() res: Response) {
    const user = await this.invitationsService.acceptInvitation(
      acceptInvitationDto.token,
      acceptInvitationDto.password,
    );
    return res.status(200).json({
      message: 'User registered successfully',
      userId: user.id,
      email: user.email,
    });
  }
}
