import { Controller, Get, Request, Post, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { User } from '../users/user.entity';
import { Public } from '../shared/auth/public.decorator';
import { InvitationsService } from '../invitations/invitations.service';
import { RegisterDto } from '../shared/auth/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationsService: InvitationsService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterDto) {
    const newUser = await this.invitationsService.acceptInvitation(
      registerDto.token,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );
    
    // Automatically login the user after registration
    const loginResponse = await this.authService.login(newUser);
    
    return { 
      message: 'User registered successfully', 
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
        emailVerified: newUser.emailVerified,
      },
      access_token: loginResponse.access_token 
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) {
    return req.user;
  }
}
