import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthService } from '../auth/auth.service';
import { Role } from '../shared/role.enum';
import { Repository, EntityManager } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let authService: AuthService;

  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: Role.Employee,
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(user => Promise.resolve({ ...mockUser, ...user })),
    findOne: jest.fn(),
    find: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuthService = {
    hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.Employee,
      };

      const result = await service.create(createUserDto);

      expect(authService.hashPassword).toHaveBeenCalledWith('password123');
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toEqual(createUserDto.email);
    });

    it('should throw BadRequestException if role is SuperAdmin', async () => {
      const createUserDto = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        role: Role.SuperAdmin,
      };

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });

    it('should use manager if provided', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockUsersRepository),
      } as unknown as EntityManager;

      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.Employee,
      };

      await service.create(createUserDto, mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(User);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('john@example.com');

      expect(result).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return user with password if selectPassword is true', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('john@example.com', true);

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user by id', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneById('1');

      expect(result).not.toHaveProperty('password');
      expect(result?.id).toEqual('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users without passwords', async () => {
      mockUsersRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { firstName: 'Updated' };
      mockUsersRepository.preload.mockResolvedValue({ ...mockUser, ...updateUserDto });
      mockUsersRepository.save.mockImplementation(user => Promise.resolve(user));

      const result = await service.update('1', updateUserDto);

      expect(result?.firstName).toEqual('Updated');
      expect(result).not.toHaveProperty('password');
    });

    it('should hash password if provided in update', async () => {
      const updateUserDto = { password: 'newPassword' };
      mockUsersRepository.preload.mockResolvedValue({ ...mockUser, ...updateUserDto });
      mockUsersRepository.save.mockImplementation(user => Promise.resolve(user));

      await service.update('1', updateUserDto);

      expect(authService.hashPassword).toHaveBeenCalledWith('newPassword');
    });

    it('should throw NotFoundException if user to update not found', async () => {
      mockUsersRepository.preload.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException when deleting SuperAdmin', async () => {
      mockUsersRepository.findOne.mockResolvedValue({ ...mockUser, role: Role.SuperAdmin });

      await expect(service.remove('1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
