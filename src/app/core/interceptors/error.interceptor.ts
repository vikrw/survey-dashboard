import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, throwError, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    // Retry logic: retry once if network failure (0) or 500 error
    retry({
      count: 1,
      delay: (error: HttpErrorResponse, retryCount) => {
        if (error.status === 0 || error.status >= 500) {
          console.warn(`[Interceptor] Retrying request (attempt ${retryCount}) due to ${error.status} error.`);
          return timer(1000); // Wait 1 second before retrying
        }
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('[Interceptor] Global error caught:', error);

      // On 401/403: Redirect to login and clear state
      if (error.status === 401 || error.status === 403) {
        console.warn('[Interceptor] Unauthorized. Logging out and redirecting to login.');
        authService.logout(); // This clears state and navigates
      }

      return throwError(() => error);
    })
  );
};
