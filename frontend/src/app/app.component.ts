import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="h-screen flex flex-col" *ngIf="auth.isAuthenticated(); else loginTemplate">
      <app-header (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-header>
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar overlay on mobile -->
        <div *ngIf="sidebarOpen()"
             class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
             (click)="sidebarOpen.set(false)"></div>

        <!-- Sidebar -->
        <aside [class.translate-x-0]="sidebarOpen()"
               [class.-translate-x-full]="!sidebarOpen()"
               class="fixed md:relative md:translate-x-0 z-50 md:z-auto transition-transform duration-200 h-full">
          <app-sidebar></app-sidebar>
        </aside>

        <!-- Main content -->
        <main class="flex-1 overflow-y-auto bg-gray-50">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-footer></app-footer>
    </div>

    <ng-template #loginTemplate>
      <router-outlet></router-outlet>
    </ng-template>
  `,
})
export class AppComponent {
  sidebarOpen = signal(false);

  constructor(public auth: AuthService) {}
}
