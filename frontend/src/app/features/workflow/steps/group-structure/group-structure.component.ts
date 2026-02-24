import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';
import {
  EmployeeClass, ClassDescription, Location, BillingAddress,
  Department, Contact, CaseStructure, ClassLocationAssignment,
} from './group-structure.interfaces';
import { AddClassDialogComponent } from './add-class-dialog.component';
import { AddLocationDialogComponent } from './add-location-dialog.component';
import { AddBillingAddressDialogComponent } from './add-billing-address-dialog.component';
import { AddContactDialogComponent } from './add-contact-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

const EARNINGS_DEFINITIONS = [
  'Annual Salary',
  'Hourly Rate x Weekly Hours x 52',
  'W-2 Earnings',
  'Base Salary + Commissions',
  'Total Compensation',
];

const WAITING_PERIOD_TYPES = [
  { value: 'first_of_month_following', label: 'First of the month following date of hire' },
  { value: 'date_of_hire', label: 'Date of hire' },
  { value: 'custom', label: 'Custom waiting period' },
];

@Component({
  selector: 'app-group-structure',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule,
    MatRadioModule, MatCheckboxModule, MatStepperModule, MatTableModule,
    MatTooltipModule, MatDialogModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-teal-600" style="font-size:20px;width:20px;height:20px;">account_tree</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Group Structure</h2>
        </div>
        <p class="text-slate-500 ml-12">Define classes, locations, billing, contacts, and case structure for this group</p>
      </div>

      <mat-stepper linear #stepper class="bg-transparent">

        <!-- SUB-STEP 1: Review/Add Classes -->
        <mat-step [stepControl]="classForm" label="Classes">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-slate-800">Employee Classes</h3>
                  <button mat-flat-button color="primary" (click)="openAddClassDialog()" style="border-radius: 8px;" type="button">
                    <mat-icon>add</mat-icon> Add Additional Class
                  </button>
                </div>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    Review the pre-populated classes below. Add additional classes if needed for different employee groups
                    with varying benefit eligibility.
                  </p>
                </div>

                <div *ngIf="classes.length === 0"
                     class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                  <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">groups</mat-icon>
                  <p class="text-slate-400 text-sm">No classes defined yet</p>
                  <p class="text-slate-300 text-xs">Click "Add Additional Class" to get started</p>
                </div>

                <table *ngIf="classes.length > 0" mat-table [dataSource]="classes" class="w-full">
                  <ng-container matColumnDef="class_id">
                    <th mat-header-cell *matHeaderCellDef>Class ID</th>
                    <td mat-cell *matCellDef="let c">{{ c.class_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let c">{{ c.description }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="w-16"></th>
                    <td mat-cell *matCellDef="let c; let i = index">
                      <button mat-icon-button matTooltip="Delete" (click)="removeClass(i)" type="button">
                        <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="classColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: classColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <form [formGroup]="classForm" style="display:none;"></form>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                      [disabled]="classes.length === 0">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- SUB-STEP 2: Class Descriptions -->
        <mat-step [stepControl]="classDescForm" label="Class Description">
          <form [formGroup]="classDescForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Class Description</h3>
                <p class="text-xs text-slate-500">Configure the details for each employee class.</p>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Select Class</mat-label>
                  <mat-select formControlName="selected_class_id" (selectionChange)="onClassSelectionChange()">
                    <mat-option *ngFor="let c of classes" [value]="c.class_id">
                      {{ c.class_id }} - {{ c.description }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div *ngIf="classDescForm.get('selected_class_id')?.value" class="space-y-4">
                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">Class Description Type</label>
                    <mat-radio-group formControlName="description_type" class="flex gap-6">
                      <mat-radio-button value="predefined" color="primary">Predefined Job Titles</mat-radio-button>
                      <mat-radio-button value="custom" color="primary">Custom Description</mat-radio-button>
                    </mat-radio-group>
                  </div>

                  <mat-form-field *ngIf="classDescForm.get('description_type')?.value === 'custom'"
                                  class="w-full" appearance="outline">
                    <mat-label>Custom Description</mat-label>
                    <textarea matInput formControlName="custom_description" rows="2"></textarea>
                  </mat-form-field>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Full-Time Hours Per Week</mat-label>
                      <input matInput type="number" formControlName="full_time_hours" min="24" max="40">
                      <mat-hint>Between 24 and 40</mat-hint>
                      <mat-error>Must be between 24 and 40</mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Earnings Definition</mat-label>
                      <mat-select formControlName="earnings_definition">
                        <mat-option *ngFor="let e of earningsDefinitions" [value]="e">{{ e }}</mat-option>
                      </mat-select>
                      <mat-error *ngIf="classDescForm.get('earnings_definition')?.hasError('required')">Earnings definition is required</mat-error>
                    </mat-form-field>
                  </div>

                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">Waiting Period</label>
                    <mat-radio-group formControlName="waiting_period_type" class="flex flex-col gap-2">
                      <mat-radio-button *ngFor="let wp of waitingPeriodTypes" [value]="wp.value" color="primary">
                        {{ wp.label }}
                      </mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="classDescForm.get('waiting_period_type')?.touched && classDescForm.get('waiting_period_type')?.invalid"
                         class="text-xs text-red-600 mt-1">Waiting period type is required</div>

                    <mat-form-field *ngIf="classDescForm.get('waiting_period_type')?.value === 'custom'"
                                    class="w-full md:w-1/2 mt-3" appearance="outline">
                      <mat-label>Custom Waiting Period (Days)</mat-label>
                      <input matInput type="number" formControlName="waiting_period_days" min="1">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                  </div>

                  <div class="flex justify-end">
                    <button mat-flat-button color="accent" (click)="saveClassDescription()" type="button"
                            style="border-radius: 8px;">
                      <mat-icon>save</mat-icon> Save Class Configuration
                    </button>
                  </div>
                </div>

                <!-- Configured classes summary -->
                <div *ngIf="classDescriptions.length > 0" class="mt-4">
                  <h4 class="text-sm font-semibold text-slate-700 mb-2">Configured Classes</h4>
                  <div class="space-y-2">
                    <div *ngFor="let cd of classDescriptions"
                         class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                      <div>
                        <span class="text-sm font-medium text-green-800">{{ cd.class_id }}</span>
                        <span class="text-xs text-green-600 ml-2">{{ cd.full_time_hours }}hrs/wk &middot; {{ cd.earnings_definition }}</span>
                      </div>
                      <mat-icon class="text-green-500" style="font-size:18px;width:18px;height:18px;">check_circle</mat-icon>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                      [disabled]="classDescriptions.length < classes.length">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 3: Locations -->
        <mat-step [stepControl]="locationForm" label="Locations">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-slate-800">Locations</h3>
                  <button mat-flat-button color="primary" (click)="openAddLocationDialog()" style="border-radius: 8px;" type="button">
                    <mat-icon>add</mat-icon> Add Additional Location
                  </button>
                </div>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    The primary location is pre-populated from the company information. Add additional locations as needed.
                  </p>
                </div>

                <div *ngIf="locations.length === 0"
                     class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                  <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">location_off</mat-icon>
                  <p class="text-slate-400 text-sm">No locations defined yet</p>
                </div>

                <table *ngIf="locations.length > 0" mat-table [dataSource]="locations" class="w-full">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Location Name</th>
                    <td mat-cell *matCellDef="let loc">{{ loc.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="address">
                    <th mat-header-cell *matHeaderCellDef>Address</th>
                    <td mat-cell *matCellDef="let loc">{{ loc.address_line1 }}, {{ loc.city }}, {{ loc.state }} {{ loc.zip }}</td>
                  </ng-container>
                  <ng-container matColumnDef="participants">
                    <th mat-header-cell *matHeaderCellDef>Active Participants</th>
                    <td mat-cell *matCellDef="let loc">{{ loc.has_active_participants ? 'Yes' : 'No' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="w-20"></th>
                    <td mat-cell *matCellDef="let loc; let i = index">
                      <button mat-icon-button matTooltip="Edit" (click)="editLocation(i)" type="button">
                        <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                      </button>
                      <button *ngIf="i > 0" mat-icon-button matTooltip="Delete" (click)="removeLocation(i)" type="button">
                        <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="locationColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: locationColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <form [formGroup]="locationForm" style="display:none;"></form>
            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                      [disabled]="locations.length === 0">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- SUB-STEP 4: Billing Address -->
        <mat-step [stepControl]="billingForm" label="Billing">
          <form [formGroup]="billingForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Billing Address</h3>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Is there a third-party billing administrator?
                  </label>
                  <mat-radio-group formControlName="has_third_party_billing" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="billingForm.get('has_third_party_billing')?.touched && billingForm.get('has_third_party_billing')?.invalid"
                       class="text-xs text-red-600 mt-1">Third-party billing selection is required</div>
                </div>

                <div *ngIf="billingForm.get('has_third_party_billing')?.value === 'yes'" class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-slate-700">Billing Addresses</h4>
                    <button mat-flat-button color="primary" (click)="openAddBillingDialog()" style="border-radius: 8px;" type="button">
                      <mat-icon>add</mat-icon> Add Billing Address
                    </button>
                  </div>

                  <div *ngIf="billingAddresses.length === 0"
                       class="flex flex-col items-center gap-2 py-6 bg-slate-50 rounded-xl border border-slate-100">
                    <mat-icon class="text-slate-300" style="font-size:36px;width:36px;height:36px;">receipt_long</mat-icon>
                    <p class="text-slate-400 text-sm">No billing addresses added yet</p>
                  </div>

                  <table *ngIf="billingAddresses.length > 0" mat-table [dataSource]="billingAddresses" class="w-full">
                    <ng-container matColumnDef="address">
                      <th mat-header-cell *matHeaderCellDef>Address</th>
                      <td mat-cell *matCellDef="let ba">{{ ba.address_line1 }}, {{ ba.city }}, {{ ba.state }} {{ ba.zip }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef class="w-20"></th>
                      <td mat-cell *matCellDef="let ba; let i = index">
                        <button mat-icon-button matTooltip="Edit" (click)="editBillingAddress(i)" type="button">
                          <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Delete" (click)="removeBillingAddress(i)" type="button">
                          <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="billingColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: billingColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 5: Departments -->
        <mat-step [stepControl]="deptForm" label="Departments">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Departments</h3>
                <p class="text-xs text-slate-500">Optional. Add departments to organize employees within the group.</p>

                <!-- Inline Add Form -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <h4 class="text-sm font-semibold text-slate-700">Add Department</h4>
                  <form [formGroup]="deptAddForm" class="flex items-end gap-4">
                    <mat-form-field class="flex-1" appearance="outline">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description">
                    </mat-form-field>
                    <mat-form-field class="w-32" appearance="outline">
                      <mat-label>Code</mat-label>
                      <input matInput formControlName="code">
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="addDepartment()" type="button"
                            [disabled]="deptAddForm.invalid" style="border-radius: 8px; margin-bottom: 22px;">
                      <mat-icon>add</mat-icon> Add
                    </button>
                  </form>
                </div>

                <div *ngIf="departments.length === 0"
                     class="flex flex-col items-center gap-2 py-6 bg-slate-50 rounded-xl border border-slate-100">
                  <mat-icon class="text-slate-300" style="font-size:36px;width:36px;height:36px;">business</mat-icon>
                  <p class="text-slate-400 text-sm">No departments added (optional)</p>
                </div>

                <table *ngIf="departments.length > 0" mat-table [dataSource]="departments" class="w-full">
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let d">{{ d.description }}</td>
                  </ng-container>
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef>Code</th>
                    <td mat-cell *matCellDef="let d">{{ d.code }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="w-16"></th>
                    <td mat-cell *matCellDef="let d; let i = index">
                      <button mat-icon-button matTooltip="Delete" (click)="removeDepartment(i)" type="button">
                        <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="deptColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: deptColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <form [formGroup]="deptForm" style="display:none;"></form>
            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- SUB-STEP 6: Contact Info -->
        <mat-step [stepControl]="contactForm" label="Contacts">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-slate-800">Contact Information</h3>
                  <button mat-flat-button color="primary" (click)="openAddContactDialog()" style="border-radius: 8px;" type="button">
                    <mat-icon>add</mat-icon> Add Additional Contact
                  </button>
                </div>

                <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                  <p class="text-sm text-amber-800">
                    At least one executive contact is required. Additional role-specific contacts can be added for
                    benefit administration, billing, and claims.
                  </p>
                </div>

                <div *ngIf="contacts.length === 0"
                     class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                  <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">contacts</mat-icon>
                  <p class="text-slate-400 text-sm">No contacts added yet</p>
                  <p class="text-slate-300 text-xs">Click "Add Additional Contact" to get started</p>
                </div>

                <table *ngIf="contacts.length > 0" mat-table [dataSource]="contacts" class="w-full">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let c">{{ c.first_name }} {{ c.last_name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="roles">
                    <th mat-header-cell *matHeaderCellDef>Roles</th>
                    <td mat-cell *matCellDef="let c">{{ c.roles.join(', ') }}</td>
                  </ng-container>
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>Email</th>
                    <td mat-cell *matCellDef="let c">{{ c.email }}</td>
                  </ng-container>
                  <ng-container matColumnDef="phone">
                    <th mat-header-cell *matHeaderCellDef>Work Phone</th>
                    <td mat-cell *matCellDef="let c">{{ c.work_phone }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="w-20"></th>
                    <td mat-cell *matCellDef="let c; let i = index">
                      <button mat-icon-button matTooltip="Edit" (click)="editContact(i)" type="button">
                        <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Delete" (click)="removeContact(i)" type="button">
                        <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="contactColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: contactColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <form [formGroup]="contactForm" style="display:none;"></form>
            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                      [disabled]="contacts.length === 0">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- SUB-STEP 7: Build Case Structure -->
        <mat-step [stepControl]="caseForm" label="Case Structure">
          <form [formGroup]="caseForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Build Case Structure</h3>
                <p class="text-xs text-slate-500">
                  Map locations, billing addresses, departments, and contacts together to define the case structure.
                </p>

                <!-- Inline Add -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <h4 class="text-sm font-semibold text-slate-700">Add Case Structure Entry</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Location</mat-label>
                      <mat-select formControlName="case_location_id">
                        <mat-option *ngFor="let loc of locations" [value]="loc.id">{{ loc.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Billing Address</mat-label>
                      <mat-select formControlName="case_billing_id">
                        <mat-option value="">None (use primary)</mat-option>
                        <mat-option *ngFor="let ba of billingAddresses" [value]="ba.id">
                          {{ ba.address_line1 }}, {{ ba.city }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Department</mat-label>
                      <mat-select formControlName="case_department_id">
                        <mat-option value="">None</mat-option>
                        <mat-option *ngFor="let d of departments" [value]="d.id">{{ d.description }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Contact</mat-label>
                      <mat-select formControlName="case_contact_id">
                        <mat-option *ngFor="let c of contacts" [value]="c.id">
                          {{ c.first_name }} {{ c.last_name }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="flex justify-end">
                    <button mat-flat-button color="primary" (click)="addCaseStructure()" type="button"
                            [disabled]="!caseForm.get('case_location_id')?.value || !caseForm.get('case_contact_id')?.value"
                            style="border-radius: 8px;">
                      <mat-icon>add</mat-icon> Add Entry
                    </button>
                  </div>
                </div>

                <div *ngIf="caseStructures.length === 0"
                     class="flex flex-col items-center gap-2 py-6 bg-slate-50 rounded-xl border border-slate-100">
                  <mat-icon class="text-slate-300" style="font-size:36px;width:36px;height:36px;">account_tree</mat-icon>
                  <p class="text-slate-400 text-sm">No case structure entries yet</p>
                </div>

                <table *ngIf="caseStructures.length > 0" mat-table [dataSource]="caseStructures" class="w-full">
                  <ng-container matColumnDef="location">
                    <th mat-header-cell *matHeaderCellDef>Location</th>
                    <td mat-cell *matCellDef="let cs">{{ getLocationName(cs.location_id) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="billing">
                    <th mat-header-cell *matHeaderCellDef>Billing</th>
                    <td mat-cell *matCellDef="let cs">{{ getBillingLabel(cs.billing_address_id) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="department">
                    <th mat-header-cell *matHeaderCellDef>Department</th>
                    <td mat-cell *matCellDef="let cs">{{ getDepartmentName(cs.department_id) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="contact">
                    <th mat-header-cell *matHeaderCellDef>Contact</th>
                    <td mat-cell *matCellDef="let cs">{{ getContactName(cs.contact_id) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="w-16"></th>
                    <td mat-cell *matCellDef="let cs; let i = index">
                      <button mat-icon-button matTooltip="Delete" (click)="removeCaseStructure(i)" type="button">
                        <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="caseColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: caseColumns;"></tr>
                </table>

                <!-- Case structure review summary -->
                <div *ngIf="caseStructures.length > 0"
                     class="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <div class="flex items-center gap-2 mb-1">
                    <mat-icon class="text-green-600" style="font-size:18px;width:18px;height:18px;">check_circle</mat-icon>
                    <span class="text-sm font-semibold text-green-800">Case Structure Summary</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span class="text-green-600 text-xs block">Entries</span>
                      <span class="text-green-900 font-semibold">{{ caseStructures.length }}</span>
                    </div>
                    <div>
                      <span class="text-green-600 text-xs block">Locations Covered</span>
                      <span class="text-green-900 font-semibold">{{ getCoveredLocationCount() }} / {{ locations.length }}</span>
                    </div>
                    <div>
                      <span class="text-green-600 text-xs block">Contacts Assigned</span>
                      <span class="text-green-900 font-semibold">{{ getCoveredContactCount() }}</span>
                    </div>
                    <div>
                      <span class="text-green-600 text-xs block">Departments Mapped</span>
                      <span class="text-green-900 font-semibold">{{ getCoveredDepartmentCount() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Amber warning when not all locations covered -->
                <div *ngIf="caseStructures.length > 0 && getCoveredLocationCount() < locations.length"
                     class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                  <p class="text-sm text-amber-800">
                    Not all locations are covered by the case structure.
                    {{ getCoveredLocationCount() }} of {{ locations.length }} locations have entries.
                  </p>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                      [disabled]="caseStructures.length === 0">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 8: Assign Classes to Locations -->
        <mat-step [stepControl]="assignForm" label="Assign Classes">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Assign Classes to Locations</h3>
                <p class="text-xs text-slate-500">
                  Each location must have at least one employee class assigned.
                </p>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    Select the employee classes that are available at each location.
                    Every location needs at least one class assigned.
                  </p>
                </div>

                <!-- Bulk apply button -->
                <div class="flex justify-end">
                  <button mat-flat-button color="accent" (click)="applyAllClassesToAllLocations()" type="button"
                          style="border-radius: 8px;" [disabled]="classes.length === 0 || locations.length === 0">
                    <mat-icon>select_all</mat-icon> Apply All Classes to All Locations
                  </button>
                </div>

                <div class="space-y-4">
                  <div *ngFor="let loc of locations; let i = index"
                       class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-slate-500" style="font-size:18px;width:18px;height:18px;">location_on</mat-icon>
                      <span class="text-sm font-semibold text-slate-800">{{ loc.name }}</span>
                    </div>
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Assigned Classes</mat-label>
                      <mat-select multiple [value]="getAssignedClassIds(loc.id)"
                                  (selectionChange)="onClassAssignmentChange(loc.id, $event.value)">
                        <mat-option *ngFor="let c of classes" [value]="c.class_id">
                          {{ c.class_id }} - {{ c.description }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    <div *ngIf="getAssignedClassIds(loc.id).length === 0"
                         class="text-xs text-red-500">
                      At least one class must be assigned to this location
                    </div>
                  </div>
                </div>

                <!-- Validation error banner -->
                <div *ngIf="validationErrors.length > 0"
                     class="bg-red-50 border border-red-300 rounded-xl p-4 space-y-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-red-600" style="font-size:20px;width:20px;height:20px;">error</mat-icon>
                    <span class="text-sm font-semibold text-red-800">Validation Errors</span>
                  </div>
                  <ul class="list-disc list-inside space-y-1 ml-7">
                    <li *ngFor="let err of validationErrors" class="text-sm text-red-700">{{ err }}</li>
                  </ul>
                </div>
              </mat-card-content>
            </mat-card>

            <form [formGroup]="assignForm" style="display:none;"></form>
            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" (click)="computeValidationErrors()" type="button"
                      style="border-radius: 8px;">
                <mat-icon>checklist</mat-icon> Validate Structure
              </button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-horizontal-stepper-header-container {
      margin-bottom: 0;
    }
    :host ::ng-deep .mat-step-header .mat-step-icon-selected {
      background-color: #4f46e5;
    }
  `],
})
export class GroupStructureComponent implements OnInit, OnDestroy {
  // Forms for stepper step controls
  classForm!: FormGroup;
  classDescForm!: FormGroup;
  locationForm!: FormGroup;
  billingForm!: FormGroup;
  deptForm!: FormGroup;
  deptAddForm!: FormGroup;
  contactForm!: FormGroup;
  caseForm!: FormGroup;
  assignForm!: FormGroup;

  // Data arrays
  classes: EmployeeClass[] = [];
  classDescriptions: ClassDescription[] = [];
  locations: Location[] = [];
  billingAddresses: BillingAddress[] = [];
  departments: Department[] = [];
  contacts: Contact[] = [];
  caseStructures: CaseStructure[] = [];
  classLocationAssignments: ClassLocationAssignment[] = [];
  validationErrors: string[] = [];

  // Table columns
  classColumns = ['class_id', 'description', 'actions'];
  locationColumns = ['name', 'address', 'participants', 'actions'];
  billingColumns = ['address', 'actions'];
  deptColumns = ['description', 'code', 'actions'];
  contactColumns = ['name', 'roles', 'email', 'phone', 'actions'];
  caseColumns = ['location', 'billing', 'department', 'contact', 'actions'];

  // Reference data
  earningsDefinitions = EARNINGS_DEFINITIONS;
  waitingPeriodTypes = WAITING_PERIOD_TYPES;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private store: WorkflowStore,
  ) {
    this.buildForms();
  }

  ngOnInit(): void {
    this.setupConditionalValidators();

    // Pre-populate a default class
    if (this.classes.length === 0) {
      this.classes = [{ class_id: '001', description: 'All Full-Time Employees' }];
    }

    // Pre-populate a default primary location placeholder
    if (this.locations.length === 0) {
      this.locations = [{
        id: crypto.randomUUID(),
        name: 'Primary Location',
        has_active_participants: true,
        same_federal_tax_id: true,
        federal_tax_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip: '',
      }];
    }

    const step = this.store.currentStep();
    if (step?.data && Object.keys(step.data).length > 0) {
      this.patchSavedData(step.data as Record<string, any>);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    // Placeholder forms for stepper validation
    this.classForm = this.fb.group({ _valid: [true] });
    this.locationForm = this.fb.group({ _valid: [true] });
    this.contactForm = this.fb.group({ _valid: [true] });
    this.assignForm = this.fb.group({ _valid: [true] });

    this.classDescForm = this.fb.group({
      selected_class_id: [''],
      description_type: ['predefined'],
      custom_description: [''],
      full_time_hours: [40, [Validators.required, Validators.min(24), Validators.max(40)]],
      earnings_definition: ['Annual Salary', Validators.required],
      waiting_period_type: ['first_of_month_following', Validators.required],
      waiting_period_days: [''],
    });

    this.billingForm = this.fb.group({
      has_third_party_billing: ['no', Validators.required],
    });

    this.deptForm = this.fb.group({ _valid: [true] });
    this.deptAddForm = this.fb.group({
      description: ['', Validators.required],
      code: ['', Validators.required],
    });

    this.caseForm = this.fb.group({
      case_location_id: [''],
      case_billing_id: [''],
      case_department_id: [''],
      case_contact_id: [''],
    });
  }

  private setupConditionalValidators(): void {
    this.classDescForm.get('waiting_period_type')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const ctrl = this.classDescForm.get('waiting_period_days')!;
        if (val === 'custom') {
          ctrl.setValidators([Validators.required, Validators.min(1)]);
        } else {
          ctrl.clearValidators();
          ctrl.setValue('');
        }
        ctrl.updateValueAndValidity();
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['classes']) this.classes = [...data['classes']];
    if (data['class_descriptions']) this.classDescriptions = [...data['class_descriptions']];
    if (data['locations']) this.locations = [...data['locations']];
    if (data['billing_addresses']) this.billingAddresses = [...data['billing_addresses']];
    if (data['departments']) this.departments = [...data['departments']];
    if (data['contacts']) this.contacts = [...data['contacts']];
    if (data['case_structures']) this.caseStructures = [...data['case_structures']];
    if (data['class_location_assignments']) this.classLocationAssignments = [...data['class_location_assignments']];
    if (data['billing']) this.billingForm.patchValue(data['billing']);
  }

  // --- Class Management ---
  openAddClassDialog(): void {
    const ref = this.dialog.open(AddClassDialogComponent, {
      width: '480px',
      data: { existingClassIds: this.classes.map(c => c.class_id) },
    });
    ref.afterClosed().subscribe((result: EmployeeClass | undefined) => {
      if (result) {
        this.classes = [...this.classes, result];
      }
    });
  }

  removeClass(index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Class',
        message: `Are you sure you want to delete class "${this.classes[index].class_id}"?`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const deletedClassId = this.classes[index].class_id;
        this.classes = this.classes.filter((_, i) => i !== index);
        // Orphan cleanup: remove matching class description
        this.classDescriptions = this.classDescriptions.filter(cd => cd.class_id !== deletedClassId);
        // Orphan cleanup: remove from class-location assignments
        this.classLocationAssignments = this.classLocationAssignments.map(a => ({
          ...a,
          class_ids: a.class_ids.filter(id => id !== deletedClassId),
        }));
      }
    });
  }

  // --- Class Description Management ---
  onClassSelectionChange(): void {
    const classId = this.classDescForm.get('selected_class_id')!.value;
    const existing = this.classDescriptions.find(cd => cd.class_id === classId);
    if (existing) {
      this.classDescForm.patchValue({
        description_type: existing.description_type,
        custom_description: existing.custom_description,
        full_time_hours: existing.full_time_hours,
        earnings_definition: existing.earnings_definition,
        waiting_period_type: existing.waiting_period_type,
        waiting_period_days: existing.waiting_period_days,
      });
    } else {
      this.classDescForm.patchValue({
        description_type: 'predefined',
        custom_description: '',
        full_time_hours: 40,
        earnings_definition: 'Annual Salary',
        waiting_period_type: 'first_of_month_following',
        waiting_period_days: '',
      });
    }
  }

  saveClassDescription(): void {
    const classId = this.classDescForm.get('selected_class_id')!.value;
    if (!classId) return;

    const desc: ClassDescription = {
      class_id: classId,
      description_type: this.classDescForm.get('description_type')!.value,
      custom_description: this.classDescForm.get('custom_description')!.value,
      full_time_hours: this.classDescForm.get('full_time_hours')!.value,
      earnings_definition: this.classDescForm.get('earnings_definition')!.value,
      waiting_period_type: this.classDescForm.get('waiting_period_type')!.value,
      waiting_period_days: this.classDescForm.get('waiting_period_days')!.value || null,
    };

    const idx = this.classDescriptions.findIndex(cd => cd.class_id === classId);
    if (idx >= 0) {
      this.classDescriptions = this.classDescriptions.map((cd, i) => i === idx ? desc : cd);
    } else {
      this.classDescriptions = [...this.classDescriptions, desc];
    }
  }

  // --- Location Management ---
  openAddLocationDialog(): void {
    const ref = this.dialog.open(AddLocationDialogComponent, {
      width: '560px',
      data: {},
    });
    ref.afterClosed().subscribe((result: Location | undefined) => {
      if (result) {
        this.locations = [...this.locations, result];
      }
    });
  }

  editLocation(index: number): void {
    const ref = this.dialog.open(AddLocationDialogComponent, {
      width: '560px',
      data: { location: this.locations[index] },
    });
    ref.afterClosed().subscribe((result: Location | undefined) => {
      if (result) {
        this.locations = this.locations.map((l, i) => i === index ? result : l);
      }
    });
  }

  removeLocation(index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Location',
        message: `Are you sure you want to delete "${this.locations[index].name}"?`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const deletedLocationId = this.locations[index].id;
        this.locations = this.locations.filter((_, i) => i !== index);
        // Orphan cleanup: remove referencing case structures
        this.caseStructures = this.caseStructures.filter(cs => cs.location_id !== deletedLocationId);
        // Orphan cleanup: remove class-location assignments for this location
        this.classLocationAssignments = this.classLocationAssignments.filter(a => a.location_id !== deletedLocationId);
      }
    });
  }

  // --- Billing Address Management ---
  openAddBillingDialog(): void {
    const primary = this.locations.length > 0 ? this.locations[0] : undefined;
    const ref = this.dialog.open(AddBillingAddressDialogComponent, {
      width: '560px',
      data: {
        primaryAddress: primary ? {
          address_line1: primary.address_line1,
          address_line2: primary.address_line2,
          city: primary.city,
          state: primary.state,
          zip: primary.zip,
        } : undefined,
      },
    });
    ref.afterClosed().subscribe((result: BillingAddress | undefined) => {
      if (result) {
        this.billingAddresses = [...this.billingAddresses, result];
      }
    });
  }

  editBillingAddress(index: number): void {
    const ref = this.dialog.open(AddBillingAddressDialogComponent, {
      width: '560px',
      data: { billingAddress: this.billingAddresses[index] },
    });
    ref.afterClosed().subscribe((result: BillingAddress | undefined) => {
      if (result) {
        this.billingAddresses = this.billingAddresses.map((b, i) => i === index ? result : b);
      }
    });
  }

  removeBillingAddress(index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Billing Address',
        message: 'Are you sure you want to delete this billing address?',
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const deletedBillingId = this.billingAddresses[index].id;
        this.billingAddresses = this.billingAddresses.filter((_, i) => i !== index);
        // Orphan cleanup: clear billing reference in case structures (set to empty = Primary)
        this.caseStructures = this.caseStructures.map(cs =>
          cs.billing_address_id === deletedBillingId ? { ...cs, billing_address_id: '' } : cs
        );
      }
    });
  }

  // --- Department Management ---
  addDepartment(): void {
    if (this.deptAddForm.invalid) return;
    const val = this.deptAddForm.value;
    this.departments = [...this.departments, {
      id: crypto.randomUUID(),
      description: val.description.trim(),
      code: val.code.trim(),
    }];
    this.deptAddForm.reset();
  }

  removeDepartment(index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${this.departments[index].description}"?`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const deletedDeptId = this.departments[index].id;
        this.departments = this.departments.filter((_, i) => i !== index);
        // Orphan cleanup: clear department reference in case structures
        this.caseStructures = this.caseStructures.map(cs =>
          cs.department_id === deletedDeptId ? { ...cs, department_id: '' } : cs
        );
      }
    });
  }

  // --- Contact Management ---
  openAddContactDialog(): void {
    const ref = this.dialog.open(AddContactDialogComponent, {
      width: '560px',
      data: {},
    });
    ref.afterClosed().subscribe((result: Contact | undefined) => {
      if (result) {
        this.contacts = [...this.contacts, result];
      }
    });
  }

  editContact(index: number): void {
    const ref = this.dialog.open(AddContactDialogComponent, {
      width: '560px',
      data: { contact: this.contacts[index] },
    });
    ref.afterClosed().subscribe((result: Contact | undefined) => {
      if (result) {
        this.contacts = this.contacts.map((c, i) => i === index ? result : c);
      }
    });
  }

  removeContact(index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Contact',
        message: `Are you sure you want to delete "${this.contacts[index].first_name} ${this.contacts[index].last_name}"?`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const deletedContactId = this.contacts[index].id;
        this.contacts = this.contacts.filter((_, i) => i !== index);
        // Orphan cleanup: remove referencing case structures (contact is required)
        this.caseStructures = this.caseStructures.filter(cs => cs.contact_id !== deletedContactId);
      }
    });
  }

  // --- Case Structure Management ---
  addCaseStructure(): void {
    const locId = this.caseForm.get('case_location_id')!.value;
    const contactId = this.caseForm.get('case_contact_id')!.value;
    if (!locId || !contactId) return;

    this.caseStructures = [...this.caseStructures, {
      id: crypto.randomUUID(),
      location_id: locId,
      billing_address_id: this.caseForm.get('case_billing_id')!.value || '',
      department_id: this.caseForm.get('case_department_id')!.value || '',
      contact_id: contactId,
    }];

    this.caseForm.patchValue({
      case_location_id: '',
      case_billing_id: '',
      case_department_id: '',
      case_contact_id: '',
    });
  }

  removeCaseStructure(index: number): void {
    this.caseStructures = this.caseStructures.filter((_, i) => i !== index);
  }

  // --- Class-Location Assignment ---
  getAssignedClassIds(locationId: string): string[] {
    const assignment = this.classLocationAssignments.find(a => a.location_id === locationId);
    return assignment?.class_ids || [];
  }

  onClassAssignmentChange(locationId: string, classIds: string[]): void {
    const idx = this.classLocationAssignments.findIndex(a => a.location_id === locationId);
    if (idx >= 0) {
      this.classLocationAssignments = this.classLocationAssignments.map((a, i) =>
        i === idx ? { ...a, class_ids: classIds } : a
      );
    } else {
      this.classLocationAssignments = [...this.classLocationAssignments, { location_id: locationId, class_ids: classIds }];
    }
  }

  // --- Lookup helpers for case structure table ---
  getLocationName(id: string): string {
    return this.locations.find(l => l.id === id)?.name || '—';
  }

  getBillingLabel(id: string): string {
    if (!id) return 'Primary';
    const ba = this.billingAddresses.find(b => b.id === id);
    return ba ? `${ba.address_line1}, ${ba.city}` : '—';
  }

  getDepartmentName(id: string): string {
    if (!id) return '—';
    return this.departments.find(d => d.id === id)?.description || '—';
  }

  getContactName(id: string): string {
    const c = this.contacts.find(ct => ct.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '—';
  }

  // --- Data persistence ---
  getData(): Record<string, any> {
    return {
      classes: this.classes,
      class_descriptions: this.classDescriptions,
      locations: this.locations,
      billing: this.billingForm.getRawValue(),
      billing_addresses: this.billingAddresses,
      departments: this.departments,
      contacts: this.contacts,
      case_structures: this.caseStructures,
      class_location_assignments: this.classLocationAssignments,
    };
  }

  isValid(): boolean {
    this.computeValidationErrors();
    return this.validationErrors.length === 0;
  }

  getValidationErrors(): string[] {
    this.computeValidationErrors();
    return this.validationErrors;
  }

  markFormsAsTouched(): void {
    this.classDescForm.markAllAsTouched();
    this.billingForm.markAllAsTouched();
  }

  computeValidationErrors(): void {
    const errors: string[] = [];

    if (this.classes.length === 0) {
      errors.push('At least one employee class is required');
    }

    const unconfiguredClasses = this.classes.filter(
      c => !this.classDescriptions.some(cd => cd.class_id === c.class_id)
    );
    if (unconfiguredClasses.length > 0) {
      errors.push(`All classes need descriptions configured (missing: ${unconfiguredClasses.map(c => c.class_id).join(', ')})`);
    }

    if (this.locations.length === 0) {
      errors.push('At least one location is required');
    }

    if (this.contacts.length === 0) {
      errors.push('At least one contact is required');
    }

    if (this.billingForm.get('has_third_party_billing')?.value === 'yes' && this.billingAddresses.length === 0) {
      errors.push('At least one billing address is required when third-party billing is enabled');
    }

    if (this.caseStructures.length === 0) {
      errors.push('At least one case structure entry is required');
    }

    const unassignedLocations = this.locations.filter(
      loc => this.getAssignedClassIds(loc.id).length === 0
    );
    if (unassignedLocations.length > 0) {
      errors.push(`All locations must have class assignments (unassigned: ${unassignedLocations.map(l => l.name).join(', ')})`);
    }

    this.validationErrors = errors;
  }

  // --- Coverage helpers for case structure summary ---
  getCoveredLocationCount(): number {
    const coveredIds = new Set(this.caseStructures.map(cs => cs.location_id));
    return coveredIds.size;
  }

  getCoveredContactCount(): number {
    const coveredIds = new Set(this.caseStructures.map(cs => cs.contact_id));
    return coveredIds.size;
  }

  getCoveredDepartmentCount(): number {
    const coveredIds = new Set(this.caseStructures.filter(cs => cs.department_id).map(cs => cs.department_id));
    return coveredIds.size;
  }

  // --- Bulk assignment ---
  applyAllClassesToAllLocations(): void {
    const allClassIds = this.classes.map(c => c.class_id);
    this.classLocationAssignments = this.locations.map(loc => ({
      location_id: loc.id,
      class_ids: [...allClassIds],
    }));
  }
}
