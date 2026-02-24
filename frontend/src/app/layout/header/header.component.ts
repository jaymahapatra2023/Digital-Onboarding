import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary" class="flex justify-between items-center shadow-md"
                 style="background: linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%);">
      <div class="flex items-center gap-3">
        <button mat-icon-button (click)="toggleSidebar.emit()" class="md:hidden">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <mat-icon class="text-white" style="font-size:20px;width:20px;height:20px;">shield</mat-icon>
        </div>
        <span class="text-lg font-bold tracking-tight">Digital Onboarding</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
          <mat-icon style="font-size:18px;width:18px;height:18px;">person</mat-icon>
          <span class="text-sm font-medium">
            {{ auth.user()?.first_name }} {{ auth.user()?.last_name }}
          </span>
        </div>
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>expand_more</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="font-semibold text-slate-800">{{ auth.user()?.first_name }} {{ auth.user()?.last_name }}</p>
            <p class="text-sm text-slate-500">{{ auth.user()?.email }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ auth.user()?.role }}</p>
          </div>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon class="text-red-500">logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(public auth: AuthService) {}
}
