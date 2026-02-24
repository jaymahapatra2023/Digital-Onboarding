import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

const QUOTED_CONTRIBUTION_PCT = 50;

@Component({
  selector: 'app-company-info',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatIconModule, MatSelectModule, MatRadioModule, MatStepperModule,
    MatTabsModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-indigo-600" style="font-size:20px;width:20px;height:20px;">business</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Company Information</h2>
        </div>
        <p class="text-slate-500 ml-12">Provide company details, contribution information, and ERISA compliance</p>
      </div>

      <mat-stepper linear #stepper class="bg-transparent">
        <!-- SUB-STEP 1: Basic Information -->
        <mat-step [stepControl]="basicForm" label="Basic Information">
          <form [formGroup]="basicForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Group Details</h3>

                <!-- Situs State -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Situs State</mat-label>
                    <input matInput formControlName="situs_state" readonly>
                    <span *ngIf="prefilledFields.has('situs_state')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                  </mat-form-field>
                  <div class="flex flex-col justify-center">
                    <div class="flex items-center">
                      <label class="text-sm text-slate-700 mr-3">Is this correct?</label>
                      <mat-radio-group formControlName="situs_state_correct" class="flex gap-4">
                        <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                        <mat-radio-button value="no" color="primary">No</mat-radio-button>
                      </mat-radio-group>
                    </div>
                    <div *ngIf="basicForm.get('situs_state_correct')?.touched && basicForm.get('situs_state_correct')?.invalid"
                         class="text-xs text-red-600 mt-1">Please confirm whether the situs state is correct</div>
                  </div>
                </div>

                <div *ngIf="basicForm.get('situs_state_correct')?.value === 'no'"
                     class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                  <p class="text-sm text-amber-800">
                    A change in situs state may require a requote. Please contact your sales representative.
                  </p>
                </div>

                <!-- Read-only info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Group Number</mat-label>
                    <input matInput formControlName="group_number" readonly>
                    <span *ngIf="prefilledFields.has('group_number')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Eligible Employees</mat-label>
                    <input matInput formControlName="eligible_employees" readonly>
                    <span *ngIf="prefilledFields.has('eligible_employees')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                  </mat-form-field>
                </div>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Primary Address</mat-label>
                  <input matInput formControlName="primary_address" readonly>
                  <span *ngIf="prefilledFields.has('primary_address')" matSuffix class="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Prefilled</span>
                </mat-form-field>

                <!-- Effective Date -->
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Effective Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="effective_date"
                         [matDatepickerFilter]="firstOfMonthFilter" [min]="minDate">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-hint>Must be the first of a future month</mat-hint>
                  <mat-error *ngIf="basicForm.get('effective_date')?.hasError('required')">Effective date is required</mat-error>
                </mat-form-field>

                <!-- Different group name -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">Is the group's name different from what's on file?</label>
                  <mat-radio-group formControlName="name_is_different" class="flex gap-6">
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                  </mat-radio-group>

                  <div *ngIf="basicForm.get('name_is_different')?.value === 'yes'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Legal Group Name</mat-label>
                      <input matInput formControlName="legal_group_name">
                      <mat-error *ngIf="basicForm.get('legal_group_name')?.hasError('required')">Legal group name is required</mat-error>
                    </mat-form-field>
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>DBA (Doing Business As)</mat-label>
                      <input matInput formControlName="dba_name">
                    </mat-form-field>
                  </div>
                </div>

                <!-- Organization type & Tax ID -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Customer Organization Type</mat-label>
                    <input matInput formControlName="organization_type" readonly>
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Federal Tax ID (EIN)</mat-label>
                    <input matInput formControlName="federal_tax_id" placeholder="XX-XXXXXXX">
                    <mat-error *ngIf="basicForm.get('federal_tax_id')?.hasError('required')">Tax ID is required</mat-error>
                    <mat-error *ngIf="basicForm.get('federal_tax_id')?.hasError('pattern')">Format: XX-XXXXXXX</mat-error>
                  </mat-form-field>
                </div>

                <!-- Correspondence Address -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Is the correspondence address different from the primary address?
                  </label>
                  <mat-radio-group formControlName="has_correspondence_address" class="flex gap-6">
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                  </mat-radio-group>

                  <div *ngIf="basicForm.get('has_correspondence_address')?.value === 'yes'" class="space-y-4 mt-3">
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Correspondence Address</mat-label>
                      <input matInput formControlName="corr_address">
                      <mat-error *ngIf="basicForm.get('corr_address')?.hasError('required')">Address is required</mat-error>
                    </mat-form-field>
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Address Line 2</mat-label>
                      <input matInput formControlName="corr_address2">
                    </mat-form-field>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Zip Code</mat-label>
                        <input matInput formControlName="corr_zip" maxlength="10">
                        <mat-error *ngIf="basicForm.get('corr_zip')?.hasError('required')">Zip code is required</mat-error>
                        <mat-error *ngIf="basicForm.get('corr_zip')?.hasError('pattern')">Format: 12345 or 12345-6789</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>City</mat-label>
                        <input matInput formControlName="corr_city">
                        <mat-error *ngIf="basicForm.get('corr_city')?.hasError('required')">City is required</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>State</mat-label>
                        <mat-select formControlName="corr_state">
                          <mat-option *ngFor="let st of states" [value]="st">{{ st }}</mat-option>
                        </mat-select>
                        <mat-error *ngIf="basicForm.get('corr_state')?.hasError('required')">State is required</mat-error>
                      </mat-form-field>
                    </div>
                  </div>
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

        <!-- SUB-STEP 2: Contributions -->
        <mat-step [stepControl]="contribForm" label="Contributions">
          <form [formGroup]="contribForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-4">
                <h3 class="text-base font-semibold text-slate-800">Employer Contributions by Product</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    If employer contribution changes more than 10% from the quoted amount, a requote may be required.
                  </p>
                </div>

                <mat-tab-group animationDuration="200ms">
                  <mat-tab *ngFor="let product of products; let i = index" [label]="product">
                    <div class="pt-5 space-y-4" [formArrayName]="'contributions'">
                      <div [formGroupName]="i" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Employer Contribution %</mat-label>
                          <input matInput type="number" formControlName="employer_contribution_pct"
                                 min="0" max="100">
                          <span matSuffix class="text-slate-500 mr-2">%</span>
                          <mat-error>Contribution percentage is required (0–100)</mat-error>
                        </mat-form-field>
                        <div class="flex items-center">
                          <label class="text-sm text-slate-700 mr-3">Pre-Tax Dollars?</label>
                          <mat-radio-group formControlName="pre_tax" class="flex gap-4">
                            <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                            <mat-radio-button value="no" color="primary">No</mat-radio-button>
                          </mat-radio-group>
                        </div>
                      </div>
                      <div *ngIf="getContributionVariance(i) as variance"
                           class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <mat-icon class="text-amber-600 mt-0.5" style="font-size:18px;width:18px;height:18px;">warning</mat-icon>
                        <p class="text-sm text-amber-800">
                          Contribution changed by {{ variance }}% from quoted amount (50%). A requote may be required.
                        </p>
                      </div>
                    </div>
                  </mat-tab>
                </mat-tab-group>
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

        <!-- SUB-STEP 3: ERISA -->
        <mat-step [stepControl]="erisaForm" label="ERISA">
          <form [formGroup]="erisaForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">ERISA Information</h3>

                <!-- Section 125 -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Are dental and/or vision products covered under a Section 125 (Cafeteria) Plan?
                  </label>
                  <mat-radio-group formControlName="section_125" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="erisaForm.get('section_125')?.touched && erisaForm.get('section_125')?.invalid"
                       class="text-xs text-red-600 mt-1">Section 125 selection is required</div>
                </div>

                <!-- ERISA Language -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Should ERISA language be included in the certificate?
                  </label>
                  <mat-radio-group formControlName="erisa_language" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="erisaForm.get('erisa_language')?.touched && erisaForm.get('erisa_language')?.invalid"
                       class="text-xs text-red-600 mt-1">ERISA language selection is required</div>

                  <div *ngIf="erisaForm.get('erisa_language')?.value === 'yes'" class="space-y-4 mt-3">
                    <mat-form-field class="w-full" appearance="outline">
                      <mat-label>Plan Year Ends</mat-label>
                      <mat-select formControlName="plan_year_type">
                        <mat-option value="calendar">Calendar Year</mat-option>
                        <mat-option value="fiscal">Fiscal Year</mat-option>
                        <mat-option value="policy">Policy Year</mat-option>
                      </mat-select>
                      <mat-error *ngIf="erisaForm.get('plan_year_type')?.hasError('required')">Plan year type is required</mat-error>
                    </mat-form-field>

                    <mat-form-field *ngIf="erisaForm.get('plan_year_type')?.value === 'fiscal'"
                                    class="w-full" appearance="outline">
                      <mat-label>Fiscal Year End Month</mat-label>
                      <mat-select formControlName="fiscal_year_month">
                        <mat-option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</mat-option>
                      </mat-select>
                      <mat-error *ngIf="erisaForm.get('fiscal_year_month')?.hasError('required')">Fiscal year end month is required</mat-error>
                    </mat-form-field>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <div>
                <!-- Stepper's "done" state is handled by the parent workflow container -->
              </div>
            </div>
          </form>
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
export class CompanyInfoComponent implements OnInit, OnDestroy {
  basicForm!: FormGroup;
  contribForm!: FormGroup;
  erisaForm!: FormGroup;

  states = US_STATES;
  months = MONTHS;
  products = ['Dental', 'Vision', 'STD', 'LTD'];
  minDate = new Date();
  prefilledFields = new Set<string>();

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
        const stateAbbr = client.primary_address_state;
        const stateName = stateAbbr ? (STATE_NAMES[stateAbbr] || stateAbbr) : '';
        const addressParts = [
          client.primary_address_street,
          client.primary_address_city,
          client.primary_address_state,
          client.primary_address_zip,
        ].filter(Boolean);

        this.basicForm.patchValue({
          situs_state: stateName,
          group_number: client.group_id || client.unique_id || '',
          eligible_employees: client.eligible_employees?.toString() || '',
          primary_address: addressParts.join(', '),
        });

        if (stateName) this.prefilledFields.add('situs_state');
        if (client.group_id || client.unique_id) this.prefilledFields.add('group_number');
        if (client.eligible_employees) this.prefilledFields.add('eligible_employees');
        if (addressParts.length > 0) this.prefilledFields.add('primary_address');
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

  // Date filter: only first of month
  firstOfMonthFilter = (d: Date | null): boolean => {
    if (!d) return false;
    return d.getDate() === 1;
  };

  private buildForms(): void {
    this.basicForm = this.fb.group({
      situs_state: [{ value: '', disabled: true }],
      situs_state_correct: ['yes', Validators.required],
      group_number: [{ value: '', disabled: true }],
      eligible_employees: [{ value: '', disabled: true }],
      primary_address: [{ value: '', disabled: true }],
      effective_date: ['', Validators.required],
      name_is_different: ['no'],
      legal_group_name: [''],
      dba_name: [''],
      organization_type: [{ value: 'Employer', disabled: true }],
      federal_tax_id: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{7}$/)]],
      has_correspondence_address: ['no'],
      corr_address: [''],
      corr_address2: [''],
      corr_zip: [''],
      corr_city: [''],
      corr_state: [''],
    });

    // Contributions form
    const contributions = this.products.map(() =>
      this.fb.group({
        employer_contribution_pct: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
        pre_tax: ['no'],
      })
    );
    this.contribForm = this.fb.group({
      contributions: this.fb.array(contributions),
    });

    this.erisaForm = this.fb.group({
      section_125: ['no', Validators.required],
      erisa_language: ['no', Validators.required],
      plan_year_type: [''],
      fiscal_year_month: [''],
    });
  }

  private setupConditionalValidators(): void {
    // When name_is_different changes, toggle legal_group_name required
    this.basicForm.get('name_is_different')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const lgn = this.basicForm.get('legal_group_name')!;
        if (val === 'yes') {
          lgn.setValidators(Validators.required);
        } else {
          lgn.clearValidators();
          lgn.setValue('');
        }
        lgn.updateValueAndValidity();
      });

    // When has_correspondence_address changes, toggle required
    this.basicForm.get('has_correspondence_address')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const fields = ['corr_address', 'corr_zip', 'corr_city', 'corr_state'];
        fields.forEach(f => {
          const ctrl = this.basicForm.get(f)!;
          if (val === 'yes') {
            if (f === 'corr_zip') {
              ctrl.setValidators([Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]);
            } else {
              ctrl.setValidators(Validators.required);
            }
          } else {
            ctrl.clearValidators();
            ctrl.setValue('');
          }
          ctrl.updateValueAndValidity();
        });
      });

    // When erisa_language=yes, plan_year_type required
    this.erisaForm.get('erisa_language')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const pyt = this.erisaForm.get('plan_year_type')!;
        if (val === 'yes') {
          pyt.setValidators(Validators.required);
        } else {
          pyt.clearValidators();
          pyt.setValue('');
        }
        pyt.updateValueAndValidity();
      });

    // When plan_year_type=fiscal, fiscal_year_month required
    this.erisaForm.get('plan_year_type')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const fym = this.erisaForm.get('fiscal_year_month')!;
        if (val === 'fiscal') {
          fym.setValidators(Validators.required);
        } else {
          fym.clearValidators();
          fym.setValue('');
        }
        fym.updateValueAndValidity();
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['basic']) {
      this.basicForm.patchValue(data['basic']);
    }
    if (data['contributions']) {
      const arr = this.contribForm.get('contributions') as FormArray;
      (data['contributions'] as any[]).forEach((c, i) => {
        if (arr.at(i)) arr.at(i).patchValue(c);
      });
    }
    if (data['erisa']) {
      this.erisaForm.patchValue(data['erisa']);
    }
  }

  get contributionsArray(): FormArray {
    return this.contribForm.get('contributions') as FormArray;
  }

  getContributionVariance(index: number): number | null {
    const ctrl = this.contributionsArray.at(index)?.get('employer_contribution_pct');
    if (!ctrl) return null;
    const diff = Math.abs((ctrl.value as number) - QUOTED_CONTRIBUTION_PCT);
    return diff > 10 ? diff : null;
  }

  getData(): Record<string, any> {
    return {
      basic: this.basicForm.getRawValue(),
      contributions: this.contributionsArray.getRawValue(),
      erisa: this.erisaForm.getRawValue(),
    };
  }

  isValid(): boolean {
    return this.basicForm.valid && this.contribForm.valid && this.erisaForm.valid;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    // Basic form
    if (this.basicForm.get('effective_date')?.invalid) {
      errors.push('Effective date is required.');
    }
    if (this.basicForm.get('federal_tax_id')?.invalid) {
      errors.push('Federal Tax ID is required (format: XX-XXXXXXX).');
    }
    if (this.basicForm.get('situs_state_correct')?.invalid) {
      errors.push('Please confirm whether the situs state is correct.');
    }
    if (this.basicForm.get('name_is_different')?.value === 'yes' &&
        this.basicForm.get('legal_group_name')?.invalid) {
      errors.push('Legal group name is required when name differs.');
    }
    if (this.basicForm.get('has_correspondence_address')?.value === 'yes') {
      if (this.basicForm.get('corr_address')?.invalid) errors.push('Correspondence address is required.');
      if (this.basicForm.get('corr_city')?.invalid) errors.push('Correspondence city is required.');
      if (this.basicForm.get('corr_state')?.invalid) errors.push('Correspondence state is required.');
      if (this.basicForm.get('corr_zip')?.invalid) errors.push('Correspondence zip code is required.');
    }

    // Contributions form
    const contributions = this.contributionsArray;
    for (let i = 0; i < contributions.length; i++) {
      const grp = contributions.at(i);
      if (grp.get('employer_contribution_pct')?.invalid) {
        errors.push(`${this.products[i]}: employer contribution percentage is required.`);
      }
    }

    // ERISA form
    if (this.erisaForm.get('section_125')?.invalid) {
      errors.push('Section 125 (Cafeteria Plan) selection is required.');
    }
    if (this.erisaForm.get('erisa_language')?.invalid) {
      errors.push('ERISA language selection is required.');
    }
    if (this.erisaForm.get('erisa_language')?.value === 'yes') {
      if (this.erisaForm.get('plan_year_type')?.invalid) {
        errors.push('Plan year type is required when ERISA language is included.');
      }
      if (this.erisaForm.get('plan_year_type')?.value === 'fiscal' &&
          this.erisaForm.get('fiscal_year_month')?.invalid) {
        errors.push('Fiscal year end month is required.');
      }
    }

    return errors;
  }

  markFormsAsTouched(): void {
    this.basicForm.markAllAsTouched();
    this.contribForm.markAllAsTouched();
    this.erisaForm.markAllAsTouched();
  }
}
