import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';

const HEALTH_RISKS = [
  'Cardiac or cardiovascular disorder',
  'Stroke or circulatory disorder',
  'Cancer, Hodgkin\'s disease, lymphoma or tumors',
  'Leukemia or other blood disorder',
  'COPD, emphysema or other lung disease',
  'Stomach, hepatitis or other liver disorder',
  'Neurological disorders',
  'Epstein-Barr, chronic fatigue syndrome or fibromyalgia',
  'Multiple Sclerosis, ALS or muscular dystrophy',
  'Mental, anxiety, depression, attempted suicide or nervous disorder',
  'Acquired Immunodeficiency Syndrome (AIDS), AIDS-Related Complex (ARC), or the Human Immunodeficiency Virus (HIV)',
  'Other',
];

interface DisabledEmployee {
  date_of_birth: string;
  date_of_disability: string;
  nature_of_claim: string;
  estimated_return_date: string;
  benefit_amount: number | null;
}

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(control.value);
  return date < new Date() ? null : { pastDate: true };
}

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(control.value);
  return date > today ? null : { futureDate: true };
}

@Component({
  selector: 'app-risk-assessment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule,
    MatRadioModule, MatCheckboxModule, MatStepperModule, MatTableModule,
    MatDatepickerModule, MatNativeDateModule, MatTooltipModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-amber-600" style="font-size:20px;width:20px;height:20px;">shield</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Risk Assessment</h2>
        </div>
        <p class="text-slate-500 ml-12">Evaluate the group risk profile for Life, Disability, Critical Illness and Hospital products</p>
      </div>

      <mat-stepper linear #stepper class="bg-transparent">

        <!-- SUB-STEP 1: Pregnant Employees -->
        <mat-step [stepControl]="pregnantForm" label="Pregnant Employees">
          <form [formGroup]="pregnantForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    This section is only shown when STD is one of the selected coverages.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Company Name</mat-label>
                    <input matInput formControlName="company_name" readonly>
                    <span *ngIf="prefilledFields.has('company_name')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Number of Eligible Employees</mat-label>
                    <input matInput formControlName="eligible_employees" readonly>
                    <span *ngIf="prefilledFields.has('eligible_employees')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                  </mat-form-field>
                </div>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Are any employees currently pregnant?
                  </label>
                  <mat-radio-group formControlName="any_pregnant" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>

                  <mat-form-field *ngIf="pregnantForm.get('any_pregnant')?.value === 'yes'"
                                  class="w-full md:w-1/2 mt-3" appearance="outline">
                    <mat-label>How many employees are currently pregnant?</mat-label>
                    <input matInput type="number" formControlName="pregnant_count" min="1">
                    <mat-error *ngIf="pregnantForm.get('pregnant_count')?.hasError('required')">Required</mat-error>
                    <mat-error *ngIf="pregnantForm.get('pregnant_count')?.hasError('min')">Must be at least 1</mat-error>
                    <mat-error *ngIf="pregnantForm.get('pregnant_count')?.hasError('max')">Cannot exceed {{ getEligibleEmployeesCount() }} eligible employees</mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-end">
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 2: Health Risks -->
        <mat-step [stepControl]="healthForm" label="Health Risks">
          <form [formGroup]="healthForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Health Risks</h3>
                <p class="text-sm text-slate-500">All fields are required unless noted.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Company Name</mat-label>
                    <input matInput [value]="pregnantForm.get('company_name')?.value" readonly>
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Number of Eligible Lives</mat-label>
                    <input matInput [value]="pregnantForm.get('eligible_employees')?.value" readonly>
                  </mat-form-field>
                </div>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Are you aware of any significant health risks with any employees?
                  </label>
                  <mat-radio-group formControlName="has_health_risks" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                </div>

                <div *ngIf="healthForm.get('has_health_risks')?.value === 'yes'" class="space-y-3">
                  <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                    <p class="text-sm text-amber-800">
                      You indicated there are health risks present. Please choose all risks that apply.
                    </p>
                  </div>

                  <div formArrayName="selected_risks" class="space-y-2">
                    <div *ngFor="let risk of healthRisks; let i = index"
                         class="flex items-start gap-2 py-1">
                      <mat-checkbox [formControlName]="i" color="primary">
                        <span class="text-sm text-slate-700">{{ risk }}</span>
                      </mat-checkbox>
                    </div>
                  </div>

                  <mat-form-field *ngIf="isOtherSelected()"
                                  class="w-full mt-3" appearance="outline">
                    <mat-label>Please specify other health risks</mat-label>
                    <textarea matInput formControlName="other_risk_details" rows="2"></textarea>
                    <mat-error *ngIf="healthForm.get('other_risk_details')?.hasError('required')">Required when Other is selected</mat-error>
                  </mat-form-field>
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

        <!-- SUB-STEP 3: Disabled Employees -->
        <mat-step [stepControl]="disabledForm" label="Disabled Employees">
          <form [formGroup]="disabledForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Disabled / Not Actively at Work Employees</h3>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Are there currently any Disabled/Not Actively at Work employees?
                  </label>
                  <mat-radio-group formControlName="has_disabled" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                </div>

                <div *ngIf="disabledForm.get('has_disabled')?.value === 'yes'" class="space-y-5">
                  <mat-form-field class="w-full md:w-1/2" appearance="outline">
                    <mat-label>How many employees are currently Disabled/Not actively at work?</mat-label>
                    <input matInput type="number" formControlName="disabled_count" min="1">
                    <mat-error *ngIf="disabledForm.get('disabled_count')?.hasError('required')">Required</mat-error>
                    <mat-error *ngIf="disabledForm.get('disabled_count')?.hasError('min')">Must be at least 1</mat-error>
                    <mat-error *ngIf="disabledForm.get('disabled_count')?.hasError('max')">Cannot exceed {{ getEligibleEmployeesCount() }} eligible employees</mat-error>
                  </mat-form-field>

                  <div *ngIf="employeeCountMismatch"
                       class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                    <p class="text-sm text-amber-800">
                      You declared {{ disabledForm.get('disabled_count')?.value }} disabled employee(s) but have added {{ disabledEmployees.length }} record(s). Please add or remove records to match.
                    </p>
                  </div>

                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">
                      Does the current carrier have Waiver of Premium and Terminal Liability?
                    </label>
                    <mat-radio-group formControlName="waiver_of_premium" class="flex gap-6">
                      <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                      <mat-radio-button value="no" color="primary">No</mat-radio-button>
                    </mat-radio-group>
                  </div>

                  <!-- Employee Details Table -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-slate-700">Disabled/Not Actively At Work Employees</h4>
                      <button mat-flat-button color="primary" (click)="addDisabledEmployee()" style="border-radius: 8px;" type="button"
                              [disabled]="showEmployeeForm">
                        <mat-icon>add</mat-icon> Add Employee Details
                      </button>
                    </div>

                    <div *ngIf="disabledEmployees.length === 0"
                         class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">person_off</mat-icon>
                      <p class="text-slate-400 text-sm">No employee details added yet</p>
                      <p class="text-slate-300 text-xs">Click "Add Employee Details" to get started</p>
                    </div>

                    <table *ngIf="disabledEmployees.length > 0" mat-table [dataSource]="disabledEmployees" class="w-full">
                      <ng-container matColumnDef="date_of_birth">
                        <th mat-header-cell *matHeaderCellDef>Date Of Birth</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.date_of_birth }}</td>
                      </ng-container>
                      <ng-container matColumnDef="date_of_disability">
                        <th mat-header-cell *matHeaderCellDef>Date Of Disability</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.date_of_disability }}</td>
                      </ng-container>
                      <ng-container matColumnDef="nature_of_claim">
                        <th mat-header-cell *matHeaderCellDef>Nature Of Claim</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.nature_of_claim }}</td>
                      </ng-container>
                      <ng-container matColumnDef="estimated_return_date">
                        <th mat-header-cell *matHeaderCellDef>Estimated Date Of Return</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.estimated_return_date }}</td>
                      </ng-container>
                      <ng-container matColumnDef="benefit_amount">
                        <th mat-header-cell *matHeaderCellDef>Benefit Amount</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.benefit_amount | currency }}</td>
                      </ng-container>
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef class="w-20"></th>
                        <td mat-cell *matCellDef="let emp; let i = index">
                          <button mat-icon-button matTooltip="Edit" (click)="editDisabledEmployee(i)" type="button">
                            <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                          </button>
                          <button mat-icon-button matTooltip="Delete" (click)="removeDisabledEmployee(i)" type="button">
                            <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="employeeColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: employeeColumns;"></tr>
                    </table>
                  </div>

                  <!-- Inline Add/Edit Employee Form -->
                  <div *ngIf="showEmployeeForm" class="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-indigo-700">
                        {{ editingEmployeeIndex >= 0 ? 'Edit' : 'Add' }} Employee Details
                      </h4>
                      <button mat-icon-button (click)="cancelEmployeeForm()" type="button">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                    <p class="text-xs text-slate-500">Add the following for each disabled/not actively at work employee.</p>

                    <form [formGroup]="employeeDetailForm" class="space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Date of Birth</mat-label>
                          <input matInput type="date" formControlName="date_of_birth">
                          <mat-error *ngIf="employeeDetailForm.get('date_of_birth')?.hasError('required')">Required</mat-error>
                          <mat-error *ngIf="employeeDetailForm.get('date_of_birth')?.hasError('pastDate')">Must be a past date</mat-error>
                        </mat-form-field>
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Date of Disability</mat-label>
                          <input matInput type="date" formControlName="date_of_disability">
                          <mat-error *ngIf="employeeDetailForm.get('date_of_disability')?.hasError('required')">Required</mat-error>
                          <mat-error *ngIf="employeeDetailForm.get('date_of_disability')?.hasError('pastDate')">Must be a past date</mat-error>
                        </mat-form-field>
                      </div>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Nature of Claim</mat-label>
                        <input matInput formControlName="nature_of_claim">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Estimated Date of Return</mat-label>
                          <input matInput type="date" formControlName="estimated_return_date">
                          <mat-error *ngIf="employeeDetailForm.get('estimated_return_date')?.hasError('required')">Required</mat-error>
                          <mat-error *ngIf="employeeDetailForm.get('estimated_return_date')?.hasError('futureDate')">Must be a future date</mat-error>
                        </mat-form-field>
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Benefit Amount</mat-label>
                          <span matPrefix class="text-slate-500 ml-2">$&nbsp;</span>
                          <input matInput type="number" formControlName="benefit_amount">
                          <mat-error *ngIf="employeeDetailForm.get('benefit_amount')?.hasError('required')">Required</mat-error>
                          <mat-error *ngIf="employeeDetailForm.get('benefit_amount')?.hasError('min')">Must be greater than $0</mat-error>
                        </mat-form-field>
                      </div>
                      <div class="flex justify-end gap-3">
                        <button mat-button type="button" (click)="cancelEmployeeForm()">Cancel</button>
                        <button mat-flat-button color="primary" type="button"
                                (click)="saveEmployeeDetail()" [disabled]="employeeDetailForm.invalid"
                                style="border-radius: 8px;">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <span [matTooltip]="showEmployeeForm ? 'Save or cancel the employee form before proceeding' : ''">
                <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;"
                        [disabled]="showEmployeeForm">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </span>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 4: Review and Submit -->
        <mat-step label="Review & Submit">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Review Risk Assessment</h3>
                <p class="text-sm text-slate-500">
                  Please review all information below before submitting. You cannot make changes after submission.
                </p>

                <!-- Summary Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                    <p class="text-2xl font-bold text-indigo-700">{{ totalRiskFlags }}</p>
                    <p class="text-xs text-indigo-500 font-medium mt-1">Risk Categories Flagged</p>
                  </div>
                  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p class="text-2xl font-bold text-amber-700">{{ disabledEmployees.length }}</p>
                    <p class="text-xs text-amber-500 font-medium mt-1">Disabled Employees Reported</p>
                  </div>
                  <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-700">{{ totalBenefitExposure | currency }}</p>
                    <p class="text-xs text-emerald-500 font-medium mt-1">Total Benefit Exposure</p>
                  </div>
                </div>

                <!-- Summary: Pregnant Employees -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Pregnant Employees</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Company Name</span>
                    <span class="text-slate-800">{{ pregnantForm.get('company_name')?.value || '—' }}</span>
                    <span class="text-slate-500">Number of Eligible Lives</span>
                    <span class="text-slate-800">{{ pregnantForm.get('eligible_employees')?.value || '—' }}</span>
                    <span class="text-slate-500">Are any employees currently pregnant?</span>
                    <span class="text-slate-800 capitalize">{{ pregnantForm.get('any_pregnant')?.value || '—' }}</span>
                    <ng-container *ngIf="pregnantForm.get('any_pregnant')?.value === 'yes'">
                      <span class="text-slate-500">How many employees are currently pregnant?</span>
                      <span class="text-slate-800">{{ pregnantForm.get('pregnant_count')?.value || '—' }}</span>
                    </ng-container>
                  </div>
                </div>

                <!-- Summary: Health Risks -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Health Risks</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Any significant health risks?</span>
                    <span class="text-slate-800 capitalize">{{ healthForm.get('has_health_risks')?.value || '—' }}</span>
                  </div>
                  <div *ngIf="healthForm.get('has_health_risks')?.value === 'yes'" class="mt-2">
                    <span class="text-xs font-medium text-slate-500">Selected risks ({{ totalSelectedRisks }}):</span>
                    <ul class="list-disc list-inside text-sm text-slate-700 mt-1">
                      <li *ngFor="let risk of getSelectedRiskNames()">{{ risk }}</li>
                    </ul>
                    <p *ngIf="isOtherSelected() && healthForm.get('other_risk_details')?.value"
                       class="text-sm text-slate-700 mt-1">
                      <span class="font-medium">Other details:</span> {{ healthForm.get('other_risk_details')?.value }}
                    </p>
                  </div>
                </div>

                <!-- Summary: Disabled Employees -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Disabled / Not Actively at Work Employees</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Any disabled/not actively at work employees?</span>
                    <span class="text-slate-800 capitalize">{{ disabledForm.get('has_disabled')?.value || '—' }}</span>
                    <ng-container *ngIf="disabledForm.get('has_disabled')?.value === 'yes'">
                      <span class="text-slate-500">Number of disabled employees</span>
                      <span class="text-slate-800">{{ disabledForm.get('disabled_count')?.value || '—' }}</span>
                      <span class="text-slate-500">Waiver of Premium and Terminal Liability?</span>
                      <span class="text-slate-800 capitalize">{{ disabledForm.get('waiver_of_premium')?.value || '—' }}</span>
                    </ng-container>
                  </div>

                  <div *ngIf="disabledEmployees.length > 0" class="mt-3">
                    <table mat-table [dataSource]="disabledEmployees" class="w-full">
                      <ng-container matColumnDef="date_of_birth">
                        <th mat-header-cell *matHeaderCellDef>Date Of Birth</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.date_of_birth }}</td>
                      </ng-container>
                      <ng-container matColumnDef="date_of_disability">
                        <th mat-header-cell *matHeaderCellDef>Date Of Disability</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.date_of_disability }}</td>
                      </ng-container>
                      <ng-container matColumnDef="nature_of_claim">
                        <th mat-header-cell *matHeaderCellDef>Nature Of Claim</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.nature_of_claim }}</td>
                      </ng-container>
                      <ng-container matColumnDef="estimated_return_date">
                        <th mat-header-cell *matHeaderCellDef>Est. Return Date</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.estimated_return_date }}</td>
                      </ng-container>
                      <ng-container matColumnDef="benefit_amount">
                        <th mat-header-cell *matHeaderCellDef>Benefit Amount</th>
                        <td mat-cell *matCellDef="let emp">{{ emp.benefit_amount | currency }}</td>
                      </ng-container>

                      <ng-container matColumnDef="footer-label">
                        <td mat-footer-cell *matFooterCellDef colspan="4" class="font-semibold text-slate-700">Total Benefit Exposure</td>
                      </ng-container>
                      <ng-container matColumnDef="footer-total">
                        <td mat-footer-cell *matFooterCellDef class="font-semibold text-slate-900">{{ totalBenefitExposure | currency }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="reviewEmployeeColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: reviewEmployeeColumns;"></tr>
                      <tr mat-footer-row *matFooterRowDef="['footer-label', 'footer-total']"></tr>
                    </table>
                  </div>
                </div>

                <!-- Electronic Signature -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h4 class="text-sm font-semibold text-slate-800">Electronic Signature</h4>

                  <form [formGroup]="signatureForm">
                  <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <mat-checkbox formControlName="declaration" color="primary">
                      <span class="text-sm text-slate-700">
                        I hereby confirm and understand that the information provided is true and complete to the best of my
                        knowledge and belief. I understand that by entering my name below and clicking the "Submit" button,
                        I am signing and submitting this document. This is a legally binding electronic signature.
                      </span>
                    </mat-checkbox>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Accepted By</mat-label>
                      <input matInput formControlName="accepted_by">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Date</mat-label>
                      <input matInput formControlName="signature_date" readonly>
                    </mat-form-field>
                  </div>
                  </form>

                  <p class="text-xs text-slate-400">
                    Note: You cannot make changes after you've clicked Submit. A copy of this document will be
                    available for printing and downloading once enrollment begins.
                  </p>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
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
export class RiskAssessmentComponent implements OnInit, OnDestroy {
  pregnantForm!: FormGroup;
  healthForm!: FormGroup;
  disabledForm!: FormGroup;
  signatureForm!: FormGroup;
  employeeDetailForm!: FormGroup;

  prefilledFields = new Set<string>();
  healthRisks = HEALTH_RISKS;
  disabledEmployees: DisabledEmployee[] = [];
  showEmployeeForm = false;
  editingEmployeeIndex = -1;

  employeeColumns = ['date_of_birth', 'date_of_disability', 'nature_of_claim', 'estimated_return_date', 'benefit_amount', 'actions'];
  reviewEmployeeColumns = ['date_of_birth', 'date_of_disability', 'nature_of_claim', 'estimated_return_date', 'benefit_amount'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: WorkflowStore,
  ) {
    this.buildForms();
  }

  ngOnInit(): void {
    this.setupConditionalValidators();

    const step = this.store.currentStep();
    const hasSavedData = step?.data && Object.keys(step.data).length > 0;

    // Prefill from client data on first visit (no saved step data yet)
    if (!hasSavedData) {
      const client = this.store.client();
      if (client) {
        this.pregnantForm.patchValue({
          company_name: client.client_name || '',
          eligible_employees: client.eligible_employees?.toString() || '',
        });

        if (client.client_name) this.prefilledFields.add('company_name');
        if (client.eligible_employees) this.prefilledFields.add('eligible_employees');
      }
    }

    if (hasSavedData) {
      this.patchSavedData(step!.data as Record<string, any>);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.pregnantForm = this.fb.group({
      company_name: [{ value: '', disabled: true }],
      eligible_employees: [{ value: '', disabled: true }],
      any_pregnant: ['no', Validators.required],
      pregnant_count: [''],
    });

    // Build selected_risks as a FormArray of booleans
    const riskControls = HEALTH_RISKS.map(() => this.fb.control(false));
    this.healthForm = this.fb.group({
      has_health_risks: ['no', Validators.required],
      selected_risks: this.fb.array(riskControls),
      other_risk_details: [''],
    });

    this.disabledForm = this.fb.group({
      has_disabled: ['no', Validators.required],
      disabled_count: [''],
      waiver_of_premium: [''],
    });

    this.signatureForm = this.fb.group({
      declaration: [false, Validators.requiredTrue],
      accepted_by: ['', Validators.required],
      signature_date: [{ value: new Date().toLocaleDateString('en-US'), disabled: true }],
    });

    this.employeeDetailForm = this.fb.group({
      date_of_birth: ['', [Validators.required, pastDateValidator]],
      date_of_disability: ['', [Validators.required, pastDateValidator]],
      nature_of_claim: ['', Validators.required],
      estimated_return_date: ['', [Validators.required, futureDateValidator]],
      benefit_amount: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  private setupConditionalValidators(): void {
    // Pregnant count required when any_pregnant = yes
    this.pregnantForm.get('any_pregnant')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const ctrl = this.pregnantForm.get('pregnant_count')!;
        if (val === 'yes') {
          const maxCount = this.getEligibleEmployeesCount();
          const validators = [Validators.required, Validators.min(1)];
          if (maxCount > 0) validators.push(Validators.max(maxCount));
          ctrl.setValidators(validators);
        } else {
          ctrl.clearValidators();
          ctrl.setValue('');
        }
        ctrl.updateValueAndValidity();
      });

    // Other risk details required when "Other" checkbox is selected
    const risksArray = this.healthForm.get('selected_risks') as FormArray;
    risksArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const otherCtrl = this.healthForm.get('other_risk_details')!;
        if (this.isOtherSelected()) {
          otherCtrl.setValidators(Validators.required);
        } else {
          otherCtrl.clearValidators();
          otherCtrl.setValue('');
        }
        otherCtrl.updateValueAndValidity();
      });

    // Disabled count + waiver required when has_disabled = yes
    this.disabledForm.get('has_disabled')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const countCtrl = this.disabledForm.get('disabled_count')!;
        const waiverCtrl = this.disabledForm.get('waiver_of_premium')!;
        if (val === 'yes') {
          const maxCount = this.getEligibleEmployeesCount();
          const validators = [Validators.required, Validators.min(1)];
          if (maxCount > 0) validators.push(Validators.max(maxCount));
          countCtrl.setValidators(validators);
          waiverCtrl.setValidators(Validators.required);
        } else {
          countCtrl.clearValidators();
          countCtrl.setValue('');
          waiverCtrl.clearValidators();
          waiverCtrl.setValue('');
          this.disabledEmployees = [];
        }
        countCtrl.updateValueAndValidity();
        waiverCtrl.updateValueAndValidity();
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['pregnant']) {
      this.pregnantForm.patchValue(data['pregnant']);
    }
    if (data['health']) {
      const { selected_risks, ...rest } = data['health'];
      this.healthForm.patchValue(rest);
      if (selected_risks) {
        const arr = this.healthForm.get('selected_risks') as FormArray;
        (selected_risks as boolean[]).forEach((val, i) => {
          if (arr.at(i)) arr.at(i).setValue(val);
        });
      }
    }
    if (data['disabled']) {
      this.disabledForm.patchValue(data['disabled']);
    }
    if (data['disabled_employees']) {
      this.disabledEmployees = [...data['disabled_employees']];
    }
    if (data['signature']) {
      this.signatureForm.patchValue(data['signature']);
    }
  }

  get selectedRisksArray(): FormArray {
    return this.healthForm.get('selected_risks') as FormArray;
  }

  isOtherSelected(): boolean {
    const arr = this.selectedRisksArray;
    // "Other" is the last item
    return arr.at(arr.length - 1)?.value === true;
  }

  getSelectedRiskNames(): string[] {
    const arr = this.selectedRisksArray;
    return HEALTH_RISKS.filter((_, i) => arr.at(i)?.value === true);
  }

  getEligibleEmployeesCount(): number {
    return parseInt(this.pregnantForm.get('eligible_employees')!.value, 10) || 0;
  }

  get employeeCountMismatch(): boolean {
    if (this.disabledForm.get('has_disabled')?.value !== 'yes') return false;
    const declaredCount = parseInt(this.disabledForm.get('disabled_count')?.value, 10) || 0;
    return declaredCount > 0 && declaredCount !== this.disabledEmployees.length;
  }

  addDisabledEmployee(): void {
    if (this.showEmployeeForm) return;
    this.editingEmployeeIndex = -1;
    this.employeeDetailForm.reset();
    this.showEmployeeForm = true;
  }

  editDisabledEmployee(index: number): void {
    this.editingEmployeeIndex = index;
    this.employeeDetailForm.patchValue(this.disabledEmployees[index]);
    this.showEmployeeForm = true;
  }

  removeDisabledEmployee(index: number): void {
    this.disabledEmployees = this.disabledEmployees.filter((_, i) => i !== index);
  }

  saveEmployeeDetail(): void {
    if (this.employeeDetailForm.invalid) return;
    const emp = this.employeeDetailForm.value as DisabledEmployee;
    if (this.editingEmployeeIndex >= 0) {
      this.disabledEmployees = this.disabledEmployees.map((e, i) =>
        i === this.editingEmployeeIndex ? emp : e
      );
    } else {
      this.disabledEmployees = [...this.disabledEmployees, emp];
    }
    this.showEmployeeForm = false;
    this.editingEmployeeIndex = -1;
  }

  cancelEmployeeForm(): void {
    this.showEmployeeForm = false;
    this.editingEmployeeIndex = -1;
  }

  get totalRiskFlags(): number {
    let count = 0;
    if (this.pregnantForm.get('any_pregnant')?.value === 'yes') count++;
    if (this.healthForm.get('has_health_risks')?.value === 'yes') count++;
    if (this.disabledForm.get('has_disabled')?.value === 'yes') count++;
    return count;
  }

  get totalSelectedRisks(): number {
    return this.getSelectedRiskNames().length;
  }

  get totalBenefitExposure(): number {
    return this.disabledEmployees.reduce((sum, emp) => sum + (emp.benefit_amount || 0), 0);
  }

  getData(): Record<string, any> {
    if (this.showEmployeeForm) this.cancelEmployeeForm();
    return {
      pregnant: this.pregnantForm.getRawValue(),
      health: {
        has_health_risks: this.healthForm.get('has_health_risks')!.value,
        selected_risks: this.selectedRisksArray.value,
        other_risk_details: this.healthForm.get('other_risk_details')!.value,
      },
      disabled: this.disabledForm.getRawValue(),
      disabled_employees: this.disabledEmployees,
      signature: this.signatureForm.getRawValue(),
    };
  }

  isValid(): boolean {
    const pregnantOk = this.pregnantForm.valid;
    const healthOk = this.healthForm.valid;
    const disabledOk = this.disabledForm.valid;
    const sigOk = this.signatureForm.valid;
    return pregnantOk && healthOk && disabledOk && sigOk && !this.employeeCountMismatch;
  }
}
