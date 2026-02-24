import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { AccessRoleType, ClientAccess } from '../../../../core/models/client.model';
import { User, UserRole } from '../../../../core/models/user.model';
import { SoldCasesService } from '../../services/sold-cases.service';

export interface AccessModalData {
  clientId: string;
  clientName: string;
  access?: ClientAccess; // If editing
}

@Component({
  selector: 'app-assign-access-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatAutocompleteModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">person_add</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ data.access ? 'Edit' : 'Assign' }} Administrator Access</h2>
          <p class="text-sm text-slate-400">{{ data.clientName }}</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <!-- User Search (only for new assignments) -->
          <div *ngIf="!data.access" class="space-y-2">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Search existing users</mat-label>
              <input matInput
                     [formControl]="searchControl"
                     [matAutocomplete]="userAuto"
                     placeholder="Type a name or email...">
              <mat-icon matSuffix class="text-slate-400">search</mat-icon>
              <mat-autocomplete #userAuto="matAutocomplete"
                                (optionSelected)="onUserSelected($event.option.value)"
                                [displayWith]="displayUser">
                <mat-option *ngFor="let user of filteredUsers" [value]="user">
                  <div class="flex flex-col leading-tight">
                    <span class="font-medium">{{ user.first_name }} {{ user.last_name }}</span>
                    <span class="text-xs text-slate-400">{{ user.email }} &middot; {{ formatRole(user.role) }}</span>
                  </div>
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <div *ngIf="selectedUser" class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1 text-sm text-indigo-700 bg-indigo-50 rounded-lg px-3 py-1">
                <mat-icon style="font-size:16px;width:16px;height:16px;">person</mat-icon>
                {{ selectedUser.first_name }} {{ selectedUser.last_name }}
              </span>
              <button mat-button class="!text-xs text-slate-500" (click)="clearSelection()">
                Clear Selection
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="first_name" [readonly]="!!selectedUser">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="last_name" [readonly]="!!selectedUser">
            </mat-form-field>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" [readonly]="!!selectedUser">
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Role Type</mat-label>
            <mat-select formControlName="role_type">
              <mat-option *ngFor="let role of roleTypes" [value]="role">
                {{ formatRole(role) }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <mat-checkbox formControlName="has_ongoing_maintenance_access" color="primary">
              <span class="text-slate-700">Ongoing maintenance access</span>
            </mat-checkbox>
            <mat-checkbox formControlName="is_account_executive" color="primary">
              <span class="text-slate-700">Account Executive</span>
            </mat-checkbox>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()"
                style="border-radius: 8px;">
          {{ data.access ? 'Update' : 'Assign' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AssignAccessModalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  searchControl = new FormControl('');
  roleTypes = Object.values(AccessRoleType);
  filteredUsers: User[] = [];
  selectedUser: User | null = null;

  private destroy$ = new Subject<void>();

  /** Map UserRole → AccessRoleType */
  private roleMap: Record<string, AccessRoleType> = {
    [UserRole.EMPLOYER]: AccessRoleType.EMPLOYER,
    [UserRole.BROKER]: AccessRoleType.BROKER,
    [UserRole.GA]: AccessRoleType.GENERAL_AGENT,
    [UserRole.TPA]: AccessRoleType.THIRD_PARTY_ADMIN,
    [UserRole.BROKER_TPA_GA_ADMIN]: AccessRoleType.BROKER_TPA_GA_ADMIN,
  };

  constructor(
    private fb: FormBuilder,
    private soldCasesService: SoldCasesService,
    public dialogRef: MatDialogRef<AssignAccessModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccessModalData,
  ) {
    this.form = this.fb.group({
      first_name: [data.access?.first_name || '', Validators.required],
      last_name: [data.access?.last_name || '', Validators.required],
      email: [data.access?.email || '', [Validators.required, Validators.email]],
      role_type: [data.access?.role_type || '', Validators.required],
      has_ongoing_maintenance_access: [data.access?.has_ongoing_maintenance_access || false],
      is_account_executive: [data.access?.is_account_executive || false],
    });
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          const query = typeof term === 'string' ? term.trim() : '';
          if (query.length < 1) return of([]);
          return this.soldCasesService.searchUsers(query);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(users => (this.filteredUsers = users));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayUser(user: User | string): string {
    if (!user || typeof user === 'string') return user as string;
    return `${user.first_name} ${user.last_name}`;
  }

  onUserSelected(user: User): void {
    this.selectedUser = user;
    this.form.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_type: this.roleMap[user.role] || '',
    });
  }

  clearSelection(): void {
    this.selectedUser = null;
    this.searchControl.setValue('');
    this.form.patchValue({
      first_name: '',
      last_name: '',
      email: '',
      role_type: '',
    });
  }

  formatRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const value = { ...this.form.value };
      if (this.selectedUser) {
        value.user_id = this.selectedUser.id;
      }
      this.dialogRef.close(value);
    }
  }
}
