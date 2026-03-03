import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { InvitationsService } from '../invitations/invitations.service';
import { RegisterDto } from '../shared/auth/register.dto';
export declare class AuthController {
    private authService;
    private invitationsService;
    constructor(authService: AuthService, invitationsService: InvitationsService);
    login(req: {
        user: User;
    }): Promise<{
        access_token: string;
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        userId: string;
        email: string;
    }>;
    getProfile(req: {
        user: User;
    }): User;
}
