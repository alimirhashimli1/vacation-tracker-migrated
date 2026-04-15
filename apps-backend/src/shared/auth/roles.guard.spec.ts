import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../role.enum';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockContext = (user: any): Partial<ExecutionContext> => ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any);

    it('should return true if no roles are required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      const context = createMockContext({});

      expect(guard.canActivate(context as ExecutionContext)).toBe(true);
    });

    it('should return true if user has one of the required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
      const context = createMockContext({ roles: [Role.Admin] });

      expect(guard.canActivate(context as ExecutionContext)).toBe(true);
    });

    it('should return false if user does not have required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
      const context = createMockContext({ roles: [Role.Employee] });

      expect(guard.canActivate(context as ExecutionContext)).toBe(false);
    });

    it('should return false if user is missing', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
      const context = createMockContext(undefined);

      expect(guard.canActivate(context as ExecutionContext)).toBe(false);
    });

    it('should return false if user.roles is missing', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
      const context = createMockContext({});

      expect(guard.canActivate(context as ExecutionContext)).toBe(false);
    });
  });
});
