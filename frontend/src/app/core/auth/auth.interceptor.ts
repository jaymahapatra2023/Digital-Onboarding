import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      } else if (error.status === 0) {
        notification.error('Network error. Check your connection and try again.');
      } else if (error.status === 403) {
        notification.error(error.error?.recovery_hint || 'You do not have permission to perform this action.');
      } else if (error.status >= 500) {
        notification.error(error.error?.recovery_hint || 'Something went wrong on the server. Please try again.');
      }
      return throwError(() => error);
    })
  );
};
