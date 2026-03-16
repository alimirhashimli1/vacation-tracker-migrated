import { Role } from './role';

export interface CreateInvitationDto {
  email: string;
  role: Role;
}

export interface InvitationResponse {
  message: string;
  invitationId: string;
  plainToken: string;
}
