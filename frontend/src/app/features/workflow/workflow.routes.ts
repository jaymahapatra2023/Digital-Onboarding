import { Routes } from '@angular/router';

export const WORKFLOW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/workflow-container/workflow-container.component').then(m => m.WorkflowContainerComponent),
  },
];
