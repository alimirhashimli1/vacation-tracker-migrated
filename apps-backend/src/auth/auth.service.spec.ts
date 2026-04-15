import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const password = 'testPassword';
      const hashedPassword = await service.hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
      expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
    });
  });

  describe('validateUser', () => {
    const testUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      emailVerified: true,
      isActive: true,
      role: 'User',
    };

    it('should return user object (excluding password) if validation succeeds', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findOneByEmail.mockResolvedValue(testUser);

      const result = await service.validateUser('test@example.com', 'testPassword');
      
      const { password, ...expectedResult } = testUser;
      expect(result).toEqual(expectedResult);
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('test@example.com', true);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      mockUsersService.findOneByEmail.mockResolvedValue(testUser);

      const result = await service.validateUser('test@example.com', 'wrongPassword');
      expect(result).toBeNull();
    });

    it('should return null if user object has no password', async () => {
      const userWithoutPassword = { ...testUser };
      delete userWithoutPassword.password;
      mockUsersService.findOneByEmail.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const unverifiedUser = { ...testUser, emailVerified: false };
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findOneByEmail.mockResolvedValue(unverifiedUser);

      await expect(service.validateUser('test@example.com', 'testPassword')).rejects.toThrow(
        new ForbiddenException('Email not verified.'),
      );
    });

    it('should throw ForbiddenException if account is inactive', async () => {
      const inactiveUser = { ...testUser, isActive: false };
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findOneByEmail.mockResolvedValue(inactiveUser);

      await expect(service.validateUser('test@example.com', 'testPassword')).rejects.toThrow(
        new ForbiddenException('Account inactive.'),
      );
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { email: 'test@example.com', id: '1', role: 'User' };
      const token = 'testToken';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
      });
    });
  });
});
