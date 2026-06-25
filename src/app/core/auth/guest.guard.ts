import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Prevents authenticated users from accessing guest-only pages (login, signup).
 * Redirects to /builder if user is already logged in.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return router.parseUrl('/builder');
  }

  return true;
};
