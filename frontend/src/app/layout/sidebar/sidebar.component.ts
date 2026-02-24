import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <nav class="h-full bg-white border-r border-gray-200 w-64">
      <div class="px-5 pt-5 pb-3">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</h2>
      </div>
      <div class="px-3">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active-nav"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-slate-600
                  hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer no-underline">
          <mat-icon class="text-slate-400" style="font-size:20px;width:20px;height:20px;">{{ item.icon }}</mat-icon>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .active-nav {
      background: #eef2ff !important;
      color: #4338ca !important;
    }
    .active-nav mat-icon {
      color: #4338ca !important;
    }
  `],
})
export class SidebarComponent {
  @Input() collapsed = false;

  navItems: NavItem[] = [
    { label: 'My Clients', route: '/clients', icon: 'business' },
  ];
}
