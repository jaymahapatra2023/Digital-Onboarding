import { Injectable, signal, computed } from '@angular/core';
import { Client, ClientAccess, ClientListParams } from '../../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class SoldCasesStore {
  // State
  private _clients = signal<Client[]>([]);
  private _totalClients = signal<number>(0);
  private _loading = signal<boolean>(false);
  private _selectedClient = signal<Client | null>(null);
  private _clientAccess = signal<ClientAccess[]>([]);
  private _params = signal<ClientListParams>({
    page: 1,
    per_page: 10,
    sort_by: 'client_name',
    sort_order: 'asc',
  });

  // Selectors
  clients = this._clients.asReadonly();
  totalClients = this._totalClients.asReadonly();
  loading = this._loading.asReadonly();
  selectedClient = this._selectedClient.asReadonly();
  clientAccess = this._clientAccess.asReadonly();
  params = this._params.asReadonly();

  totalPages = computed(() => Math.ceil(this._totalClients() / (this._params().per_page || 10)));

  // Actions
  setClients(clients: Client[], total: number): void {
    this._clients.set(clients);
    this._totalClients.set(total);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setSelectedClient(client: Client | null): void {
    this._selectedClient.set(client);
  }

  setClientAccess(access: ClientAccess[]): void {
    this._clientAccess.set(access);
  }

  updateParams(params: Partial<ClientListParams>): void {
    this._params.update(current => ({ ...current, ...params }));
  }
}
