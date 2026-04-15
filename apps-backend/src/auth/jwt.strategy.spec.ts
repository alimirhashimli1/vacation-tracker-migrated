import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../shared/role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: Role.Employee,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user with roles when user exists and is active', async () => {
      (usersService.findOneById as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'user-id' });

      expect(usersService.findOneById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ ...mockUser, roles: [Role.Employee] });
    });

    it('should throw UnauthorizedException when user does not exist (throws NotFoundException)', async () => {
      (usersService.findOneById as jest.Mock).mockRejectedValue(new Error('NotFoundException'));

      await expect(strategy.validate({ sub: 'non-existent' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      (usersService.findOneById as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(strategy.validate({ sub: 'user-id' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
