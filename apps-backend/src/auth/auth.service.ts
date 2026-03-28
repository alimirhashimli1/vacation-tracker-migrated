import { Injectable, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[AUTH] Validating user: ${email}`);
    const user = await this.usersService.findOneByEmail(email, true);
    if (!user) {
      console.log(`[AUTH] User not found: ${email}`);
      return null;
    }
    console.log(`[AUTH] User found: ${email}, checking password...`);
    const isMatch = await bcrypt.compare(pass, user.password || '');
    if (isMatch) {
      console.log(`[AUTH] Password match for: ${email}`);
      if (!user.emailVerified) {
        console.log(`[AUTH] Email not verified for: ${email}`);
        throw new ForbiddenException('Email not verified.');
      }
      if (!user.isActive) {
        console.log(`[AUTH] Account inactive for: ${email}`);
        throw new ForbiddenException('Account inactive.');
      }
      const { password, ...result } = user;
      return result;
    }
    console.log(`[AUTH] Password mismatch for: ${email}`);
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
