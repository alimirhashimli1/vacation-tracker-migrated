import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InvitationsService } from '../invitations/invitations.service';
import { User } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let invitationsService: InvitationsService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: InvitationsService,
          useValue: {
            acceptInvitation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    invitationsService = module.get<InvitationsService>(InvitationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return the result of authService.login', async () => {
      const loginResult = { access_token: 'jwt-token' };
      (authService.login as jest.Mock).mockResolvedValue(loginResult);
      const req = { user: mockUser };

      const result = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(loginResult);
    });
  });

  describe('register', () => {
    it('should call invitationsService.acceptInvitation and return success message', async () => {
      const registerDto = {
        token: 'valid-token',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };
      
      // Since the actual implementation doesn't use the email from DTO for logic but relies on the token/invitation,
      // we mock the service to return the new user.
      (invitationsService.acceptInvitation as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);

      expect(invitationsService.acceptInvitation).toHaveBeenCalledWith(
        registerDto.token,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  describe('getProfile', () => {
    it('should return the user from the request', () => {
      const req = { user: mockUser };
      const result = controller.getProfile(req);
      expect(result).toEqual(mockUser);
    });
  });
});
