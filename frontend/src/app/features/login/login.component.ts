import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatInputModule,
    MatFormFieldModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex">
      <!-- Left: Branded Panel (hidden on mobile) -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
           style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #4f46e5 100%);">
        <!-- Decorative circles -->
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 bg-white"></div>
        <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 bg-white"></div>
        <div class="absolute top-1/4 right-10 w-48 h-48 rounded-full opacity-5 bg-white"></div>

        <div class="relative z-10 max-w-md px-12 text-white">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <mat-icon class="text-white" style="font-size:28px;width:28px;height:28px;">shield</mat-icon>
            </div>
            <span class="text-2xl font-bold tracking-tight">Digital Onboarding</span>
          </div>
          <h1 class="text-4xl font-bold leading-tight mb-4">
            Group Benefits<br/>Made Simple
          </h1>
          <p class="text-indigo-200 text-lg mb-10 leading-relaxed">
            Streamline your employer group setup with our guided onboarding workflow.
          </p>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <mat-icon class="text-indigo-200" style="font-size:18px;width:18px;height:18px;">rocket_launch</mat-icon>
              </div>
              <div>
                <p class="font-semibold">Fast Setup</p>
                <p class="text-indigo-300 text-sm">Complete group onboarding in minutes, not days</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <mat-icon class="text-indigo-200" style="font-size:18px;width:18px;height:18px;">task_alt</mat-icon>
              </div>
              <div>
                <p class="font-semibold">Step-by-Step Guidance</p>
                <p class="text-indigo-300 text-sm">Never miss a requirement with our guided workflow</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <mat-icon class="text-indigo-200" style="font-size:18px;width:18px;height:18px;">lock</mat-icon>
              </div>
              <div>
                <p class="font-semibold">Secure & Compliant</p>
                <p class="text-indigo-300 text-sm">Enterprise-grade security for sensitive data</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right: Login Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6">
        <div class="w-full max-w-md">
          <!-- Mobile logo -->
          <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <mat-icon class="text-white" style="font-size:22px;width:22px;height:22px;">shield</mat-icon>
            </div>
            <span class="text-xl font-bold text-slate-800">Digital Onboarding</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p class="text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form (ngSubmit)="onLogin()" class="space-y-5">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required>
              <mat-icon matPrefix class="text-slate-400">email</mat-icon>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" [(ngModel)]="password" name="password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon class="text-slate-400">{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-flat-button color="primary" class="w-full h-12 text-base font-semibold" type="submit" [disabled]="loading"
                    style="border-radius: 10px;">
              <mat-spinner *ngIf="loading" diameter="20" class="inline-block mr-2"></mat-spinner>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <p class="text-center text-xs text-slate-400 mt-10">
            &copy; {{ currentYear }} Digital Onboarding Portal
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  currentYear = new Date().getFullYear();

  constructor(
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService,
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
        this.notification.success('Welcome back!');
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(err.error?.detail || 'Login failed');
      },
    });
  }
}
