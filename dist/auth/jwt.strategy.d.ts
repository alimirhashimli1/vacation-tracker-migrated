import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: any): Promise<{
        roles: import("../shared/role.enum").Role[];
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        password?: string;
        role: import("../shared/role.enum").Role;
        isActive: boolean;
        emailVerified: boolean;
        region: string;
        createdAt: Date;
        updatedAt: Date;
        absences: import("../absence/absence.entity").Absence[];
        invitations: import("../invitations/invitations.entity").Invitation[];
    }>;
}
export {};
