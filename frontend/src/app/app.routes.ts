import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    path: 'group-setup',
    canActivate: [authGuard],
    loadChildren: () => import('./features/group-setup/group-setup.routes').then(m => m.GROUP_SETUP_ROUTES),
  },
  {
    path: 'workflow/:clientId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/workflow/workflow.routes').then(m => m.WORKFLOW_ROUTES),
  },
  { path: '', redirectTo: '/clients', pathMatch: 'full' },
  { path: '**', redirectTo: '/clients' },
];
