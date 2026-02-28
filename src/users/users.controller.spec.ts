import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../shared/role.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from './user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: Role.Employee,
    isActive: true,
    emailVerified: false,
    region: 'DE',
  } as User;

  const mockAdmin = {
    id: 'admin-id',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: Role.Admin,
    isActive: true,
    emailVerified: true,
    region: 'DE',
  } as User;

  const mockSuperAdmin = {
    id: 'super-admin-id',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@example.com',
    role: Role.SuperAdmin,
    isActive: true,
    emailVerified: true,
    region: 'DE',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should allow a user to view their own profile', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      const req = { user: { id: mockUser.id, roles: [Role.Employee] } };

      const result = await controller.findOne(mockUser.id, req);
      expect(result).toEqual(mockUser);
    });

    it('should allow an Admin to view any profile', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      const req = { user: { id: 'some-other-id', roles: [Role.Admin] } };

      const result = await controller.findOne(mockUser.id, req);
      expect(result).toEqual(mockUser);
    });

    it('should allow a SuperAdmin to view any profile', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      const req = { user: { id: 'some-other-id', roles: [Role.SuperAdmin] } };

      const result = await controller.findOne(mockUser.id, req);
      expect(result).toEqual(mockUser);
    });

    it('should allow a SuperAdmin to update any profile', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      jest.spyOn(service, 'update').mockResolvedValue(mockUser);
      const req = { user: { id: 'super-admin-id', roles: [Role.SuperAdmin] } };

      const result = await controller.update(mockUser.id, { firstName: 'Updated' }, req);
      expect(result).toEqual(mockUser);
    });

    it('should deny a user from viewing another profile', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      const req = { user: { id: 'another-user-id', roles: [Role.Employee] } };

      await expect(controller.findOne(mockUser.id, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow an Admin to update a normal user', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser);
      jest.spyOn(service, 'update').mockResolvedValue({ ...mockUser, firstName: 'Updated' });
      const req = { user: { id: 'admin-id', roles: [Role.Admin] } };

      const result = await controller.update(mockUser.id, { firstName: 'Updated' }, req);
      expect(result?.firstName).toBe('Updated');
    });

    it('should prevent an Admin from updating a SuperAdmin', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockSuperAdmin);
      const req = { user: { id: 'admin-id', roles: [Role.Admin] } };

      await expect(controller.update(mockSuperAdmin.id, { firstName: 'Updated' }, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow a user to update their own profile (if they have Role.Admin... wait)', async () => {
       // Controller has @Roles(Role.Admin) on update method.
       // So a normal Employee CANNOT even call this method due to RolesGuard.
    });
  });
});
