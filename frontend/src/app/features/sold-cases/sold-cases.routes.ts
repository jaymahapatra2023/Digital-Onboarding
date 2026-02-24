import { Routes } from '@angular/router';

export const SOLD_CASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/client-list/client-list.component').then(m => m.ClientListComponent),
  },
];
