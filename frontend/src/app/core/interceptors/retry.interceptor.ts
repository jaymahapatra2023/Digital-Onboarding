import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { timer, retry } from 'rxjs';

const MAX_RETRIES = 2;
const RETRYABLE_METHODS = ['GET', 'PUT'];

function isRetryableError(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status >= 500;
}

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!RETRYABLE_METHODS.includes(req.method)) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse && isRetryableError(error)) {
          // Exponential backoff: 1s, 2s
          return timer(retryCount * 1000);
        }
        // Non-retryable error (4xx) — rethrow immediately
        throw error;
      },
    })
  );
};
