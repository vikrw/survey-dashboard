import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const user = authService.currentUser();
  if (user && user.role === 'admin') {
    return true;
  }

  // Not an admin or not loaded yet
  toastService.error('Access denied. Admin role required to view Dashboard.');
  return router.parseUrl('/builder');
};
