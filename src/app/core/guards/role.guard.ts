import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };
};
