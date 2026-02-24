import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { User, LoginRequest, TokenResponse } from '../models/user.model';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.token());
  userRole = computed(() => this.currentUser()?.role ?? null);

  constructor(private api: ApiService, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token) {
      this.token.set(token);
    }
    if (user) {
      try { this.currentUser.set(JSON.parse(user)); } catch {}
    }
  }

  login(credentials: LoginRequest) {
    return this.api.post<TokenResponse>('/auth/login', credentials).pipe(
      tap(response => {
        this.token.set(response.access_token);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        this.fetchCurrentUser();
      })
    );
  }

  fetchCurrentUser() {
    this.api.get<User>('/auth/me').subscribe({
      next: (user) => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: () => this.logout(),
    });
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return;
    return this.api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }).pipe(
      tap(response => {
        this.token.set(response.access_token);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
      })
    );
  }
}
