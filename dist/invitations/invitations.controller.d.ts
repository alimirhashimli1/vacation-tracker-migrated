import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from '../shared/create-invitation.dto';
import { Response } from 'express';
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    createInvitation(createInvitationDto: CreateInvitationDto, res: Response, req: any): Promise<Response<any, Record<string, any>>>;
}
