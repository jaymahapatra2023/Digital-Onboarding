import { Routes } from '@angular/router';

export const GROUP_SETUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent),
  },
];
