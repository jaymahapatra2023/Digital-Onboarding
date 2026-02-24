import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const userRole = authService.userRole();
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }
    return false;
  };
};
