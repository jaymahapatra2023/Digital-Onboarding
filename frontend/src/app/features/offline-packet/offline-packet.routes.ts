import { Routes } from '@angular/router';

export const OFFLINE_PACKET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/offline-packet-hub/offline-packet-hub.component').then(
        m => m.OfflinePacketHubComponent
      ),
  },
];
