import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'clients',
    canActivate: [authGuard],
    loadChildren: () => import('./features/sold-cases/sold-cases.routes').then(m => m.SOLD_CASES_ROUTES),
  },
  {
    path: 'group-setup/:clientId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/group-setup/group-setup.routes').then(m => m.GROUP_SETUP_ROUTES),
  },
  {
    path: 'workflow/:clientId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/workflow/workflow.routes').then(m => m.WORKFLOW_ROUTES),
  },
  {
    path: 'offline-packet/:clientId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/offline-packet/offline-packet.routes').then(m => m.OFFLINE_PACKET_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('BROKER_TPA_GA_ADMIN')],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '', redirectTo: '/clients', pathMatch: 'full' },
  { path: '**', redirectTo: '/clients' },
];
