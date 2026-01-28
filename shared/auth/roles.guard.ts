import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no specific roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // SUPERADMIN bypass: If the user has the SuperAdmin role, they can access anything
    if (user && user.roles && user.roles.includes(Role.SuperAdmin)) {
      return true;
    }

    // Check if the user has any of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}