import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
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
import { FileUploaderComponent } from '../../../../shared/components/file-uploader/file-uploader.component';
import { EConsentDialogComponent } from './e-consent-dialog.component';
import { ClaimEntry } from './authorization.interfaces';

const EMPLOYEE_TITLE_OPTIONS = [
  'Benefits Administrator',
  'HR Manager',
  'HR Director',
  'VP of Human Resources',
  'CFO',
  'Office Manager',
  'Payroll Manager',
  'Controller',
  'Other',
];

const CLAIM_PRODUCT_OPTIONS = [
  'Life',
  'AD&D',
  'Short Term Disability',
  'Long Term Disability',
  'Dental',
  'Vision',
  'Critical Illness',
  'Hospital Indemnity',
];

@Component({
  selector: 'app-authorization',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule,
    MatRadioModule, MatCheckboxModule, MatStepperModule, MatTableModule,
    MatTooltipModule, MatDialogModule, FileUploaderComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-purple-600" style="font-size:20px;width:20px;height:20px;">verified_user</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Authorization</h2>
        </div>
        <p class="text-slate-500 ml-12">Complete all required authorizations and acknowledgements</p>
      </div>

      <mat-stepper linear #stepper class="bg-transparent">

        <!-- SUB-STEP 1: Online Access -->
        <mat-step [stepControl]="onlineAccessForm" label="Online Access">
          <form [formGroup]="onlineAccessForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Online Access Preferences</h3>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Should your Broker/TPA/GA have online access to ongoing maintenance?
                  </label>
                  <mat-radio-group formControlName="broker_online_access" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="onlineAccessForm.get('broker_online_access')?.touched && onlineAccessForm.get('broker_online_access')?.invalid"
                       class="text-xs text-red-600 mt-1">Online access selection is required</div>
                </div>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Document delivery preference
                  </label>
                  <mat-radio-group formControlName="document_delivery" class="flex gap-6">
                    <mat-radio-button value="electronic" color="primary">Electronic / Email</mat-radio-button>
                    <mat-radio-button value="paper" color="primary">Paper / Mail</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="onlineAccessForm.get('document_delivery')?.touched && onlineAccessForm.get('document_delivery')?.invalid"
                       class="text-xs text-red-600 mt-1">Document delivery preference is required</div>
                </div>

                <button mat-button class="text-indigo-600" type="button" (click)="openEConsent()">
                  <mat-icon>open_in_new</mat-icon> Read e-consent information
                </button>
              </mat-card-content>
            </mat-card>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 2: Privacy Notice -->
        <mat-step [stepControl]="privacyForm" label="Privacy Notice">
          <form [formGroup]="privacyForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Privacy Notice</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">description</mat-icon>
                  <div>
                    <p class="text-sm text-blue-800 font-medium">View and Download the Privacy Notice</p>
                    <p class="text-xs text-blue-600 mt-1">Please review the privacy notice before acknowledging below.</p>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="privacy_notice_acknowledged" color="primary">
                    <span class="text-sm text-slate-700">
                      By checking this box, I, in my capacity as the employer, certify that the Privacy Notice
                      has been distributed to all covered persons within the group.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="privacyForm.get('privacy_notice_acknowledged')?.touched && privacyForm.get('privacy_notice_acknowledged')?.invalid"
                       class="text-xs text-red-600 mt-1">Privacy notice acknowledgement is required</div>
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

        <!-- SUB-STEP 3: Intermediary & Producer Compensation -->
        <mat-step [stepControl]="intermediaryForm" label="Intermediary Compensation">
          <form [formGroup]="intermediaryForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Intermediary &amp; Producer Compensation</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">description</mat-icon>
                  <p class="text-sm text-blue-800">
                    View the <span class="font-medium">Intermediary Compensation Notice</span> for details
                    on intermediary and producer compensation arrangements.
                  </p>
                </div>

                <div class="space-y-3">
                  <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <mat-checkbox formControlName="intermediary_notice_received" color="primary">
                      <span class="text-sm text-slate-700">
                        I certify that I have received a copy of the Intermediary Compensation Notice.
                      </span>
                    </mat-checkbox>
                    <div *ngIf="intermediaryForm.get('intermediary_notice_received')?.touched && intermediaryForm.get('intermediary_notice_received')?.invalid"
                         class="text-xs text-red-600 mt-1">Intermediary notice acknowledgement is required</div>
                  </div>

                  <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <mat-checkbox formControlName="producer_compensation_acknowledged" color="primary">
                      <span class="text-sm text-slate-700">
                        I acknowledge the Producer Compensation Disclosure and understand the compensation
                        arrangements described therein.
                      </span>
                    </mat-checkbox>
                    <div *ngIf="intermediaryForm.get('producer_compensation_acknowledged')?.touched && intermediaryForm.get('producer_compensation_acknowledged')?.invalid"
                         class="text-xs text-red-600 mt-1">Producer compensation acknowledgement is required</div>
                  </div>
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

        <!-- SUB-STEP 4: Third Party Billing -->
        <mat-step [stepControl]="thirdPartyForm" label="Third Party Billing">
          <form [formGroup]="thirdPartyForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Third Party Billing</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    This section applies if third-party billing was selected in Group Structure.
                  </p>
                </div>

                <p class="text-sm text-slate-600">
                  If a third party has been designated to receive billing on behalf of the group,
                  a Confirmation &amp; Agreement form must be completed. Please download, review, and
                  acknowledge the form below.
                </p>

                <button mat-button class="text-indigo-600" type="button">
                  <mat-icon>download</mat-icon> Download the Confirmation &amp; Agreement form
                </button>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="agreement_reviewed" color="primary">
                    <span class="text-sm text-slate-700">
                      I confirm I have reviewed the Confirmation &amp; Agreement form for third party billing.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="thirdPartyForm.get('agreement_reviewed')?.touched && thirdPartyForm.get('agreement_reviewed')?.invalid"
                       class="text-xs text-red-600 mt-1">Third party billing agreement review is required</div>
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

        <!-- SUB-STEP 5: Gross Up Acknowledgement -->
        <mat-step [stepControl]="grossUpForm" label="Gross Up">
          <form [formGroup]="grossUpForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Gross Up Acknowledgement</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    This section applies when Disability products are sold with Gross Up.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Company Name</mat-label>
                    <input matInput formControlName="company_name" readonly>
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Group Number</mat-label>
                    <input matInput formControlName="group_number" readonly>
                  </mat-form-field>
                </div>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p class="text-sm text-slate-600">
                    The employer has elected to "gross up" the disability benefit so that after
                    applicable federal income tax withholding, the net benefit equals the plan
                    benefit amount. The employer acknowledges that this gross up arrangement
                    may result in additional tax obligations and agrees to indemnify and hold
                    harmless the insurer with respect to any claims or tax liabilities arising
                    from this arrangement.
                  </p>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="gross_up_acknowledged" color="primary">
                    <span class="text-sm text-slate-700">
                      I acknowledge the Gross Up tax arrangements as stated above.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="grossUpForm.get('gross_up_acknowledged')?.touched && grossUpForm.get('gross_up_acknowledged')?.invalid"
                       class="text-xs text-red-600 mt-1">Gross up acknowledgement is required</div>
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

        <!-- SUB-STEP 6: HIPAA -->
        <mat-step [stepControl]="hipaaForm" label="HIPAA">
          <form [formGroup]="hipaaForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">HIPAA Authorization</h3>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Do you need access to Dental/Vision claims Protected Health Information (PHI)?
                  </label>
                  <mat-radio-group formControlName="phi_access" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="hipaaForm.get('phi_access')?.touched && hipaaForm.get('phi_access')?.invalid"
                       class="text-xs text-red-600 mt-1">PHI access selection is required</div>
                </div>

                <!-- PHI Access = Yes: Claims Access Section -->
                <ng-container *ngIf="hipaaForm.get('phi_access')?.value === 'yes'">
                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">Claims Access Option</label>
                    <mat-radio-group formControlName="claims_access_option" class="flex flex-col gap-3">
                      <mat-radio-button value="option_a" color="primary">
                        <span class="text-sm">Option A: Include MetLife HIPAA language in the group application</span>
                      </mat-radio-button>
                      <mat-radio-button value="option_b" color="primary">
                        <span class="text-sm">Option B: I have my own HIPAA form and will submit a copy</span>
                      </mat-radio-button>
                    </mat-radio-group>
                  </div>

                  <!-- Option A: HIPAA Authorization Request -->
                  <ng-container *ngIf="hipaaForm.get('claims_access_option')?.value === 'option_a'">
                    <div class="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
                      <h4 class="text-sm font-semibold text-indigo-700">HIPAA Authorization Request</h4>

                      <!-- Employee Titles -->
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <label class="text-sm font-medium text-slate-700">Employee Title(s) Authorized for PHI Access</label>
                          <button *ngIf="employeeTitles.length < 4"
                                  mat-button class="text-indigo-600 text-sm" type="button" (click)="addEmployeeTitle()">
                            <mat-icon style="font-size:16px;width:16px;height:16px;">add</mat-icon> Add Employee Title
                          </button>
                        </div>

                        <div *ngFor="let title of employeeTitles.controls; let i = index" class="flex items-center gap-3">
                          <mat-form-field class="flex-1" appearance="outline">
                            <mat-label>Employee Title {{ i + 1 }}</mat-label>
                            <mat-select [formControl]="getEmployeeTitleControl(i)">
                              <mat-option *ngFor="let opt of employeeTitleOptions" [value]="opt">{{ opt }}</mat-option>
                            </mat-select>
                            <mat-error>Required</mat-error>
                          </mat-form-field>
                          <button *ngIf="employeeTitles.length > 1"
                                  mat-icon-button matTooltip="Remove" type="button" (click)="removeEmployeeTitle(i)">
                            <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                          </button>
                        </div>
                      </div>

                      <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <label class="text-sm font-medium text-slate-700">Designate a Privacy Officer?</label>
                        <mat-radio-group formControlName="privacy_officer" class="flex gap-6">
                          <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                          <mat-radio-button value="no" color="primary">No</mat-radio-button>
                        </mat-radio-group>
                      </div>

                      <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <label class="text-sm font-medium text-slate-700">Include Participant's Rights section? (Optional)</label>
                        <mat-radio-group formControlName="participants_rights" class="flex gap-6">
                          <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                          <mat-radio-button value="no" color="primary">No</mat-radio-button>
                        </mat-radio-group>
                      </div>

                      <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <label class="text-sm font-medium text-slate-700">Include Privacy Complaints/Issues section? (Optional)</label>
                        <mat-radio-group formControlName="privacy_complaints" class="flex gap-6">
                          <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                          <mat-radio-button value="no" color="primary">No</mat-radio-button>
                        </mat-radio-group>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Option B: File Upload -->
                  <ng-container *ngIf="hipaaForm.get('claims_access_option')?.value === 'option_b'">
                    <div class="space-y-3">
                      <p class="text-sm text-slate-600">
                        Please upload a copy of your HIPAA authorization form.
                      </p>
                      <app-file-uploader
                        [acceptedTypes]="'.doc,.docx,.pdf,.jpg,.jpeg,.tif,.tiff,.txt'"
                        [maxSizeMB]="4"
                        (filesSelected)="onHipaaFileSelected($event)">
                      </app-file-uploader>
                    </div>
                  </ng-container>
                </ng-container>

                <!-- PHI Access = No: Download HIPAA Info -->
                <div *ngIf="hipaaForm.get('phi_access')?.value === 'no'">
                  <button mat-button class="text-indigo-600" type="button">
                    <mat-icon>download</mat-icon> Download HIPAA Information
                  </button>
                </div>

                <!-- HIPAA E-Sign (shown when PHI question is answered) -->
                <ng-container *ngIf="hipaaForm.get('phi_access')?.value">
                  <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4 mt-4">
                    <h4 class="text-sm font-semibold text-slate-800">HIPAA Review &amp; Electronic Signature</h4>

                    <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <mat-checkbox formControlName="hipaa_terms_accepted" color="primary">
                        <span class="text-sm text-slate-700">
                          I have reviewed and agree to the terms outlined in the HIPAA information
                          provided above.
                        </span>
                      </mat-checkbox>
                      <div *ngIf="hipaaForm.get('hipaa_terms_accepted')?.touched && hipaaForm.get('hipaa_terms_accepted')?.invalid"
                           class="text-xs text-red-600 mt-1">HIPAA terms acceptance is required</div>
                    </div>

                    <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <mat-checkbox formControlName="esign_declaration" color="primary">
                        <span class="text-sm text-slate-700">
                          I hereby confirm that by entering my information below, I am providing my
                          electronic signature for the HIPAA authorization.
                        </span>
                      </mat-checkbox>
                      <div *ngIf="hipaaForm.get('esign_declaration')?.touched && hipaaForm.get('esign_declaration')?.invalid"
                           class="text-xs text-red-600 mt-1">HIPAA electronic signature declaration is required</div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Group Name</mat-label>
                        <input matInput formControlName="esign_group_name">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Group Number</mat-label>
                        <input matInput formControlName="esign_group_number">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>First Name</mat-label>
                        <input matInput formControlName="esign_first_name">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Last Name</mat-label>
                        <input matInput formControlName="esign_last_name">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Date</mat-label>
                        <input matInput formControlName="esign_date" readonly>
                      </mat-form-field>
                    </div>
                  </div>
                </ng-container>
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

        <!-- SUB-STEP 7: Disability Tax Authorization -->
        <mat-step [stepControl]="disabilityTaxForm" label="Disability Tax">
          <form [formGroup]="disabilityTaxForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Disability Tax Authorization</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    This section applies when LTD/STD disability products are sold.
                  </p>
                </div>

                <!-- LTD Section -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h4 class="text-sm font-semibold text-slate-800">Long Term Disability (LTD)</h4>

                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">Who issues the disability W-2?</label>
                    <mat-radio-group formControlName="ltd_w2_issuer" class="flex gap-6">
                      <mat-radio-button value="customer" color="primary">Customer</mat-radio-button>
                      <mat-radio-button value="metlife" color="primary">MetLife</mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="disabilityTaxForm.get('ltd_w2_issuer')?.touched && disabilityTaxForm.get('ltd_w2_issuer')?.invalid"
                         class="text-xs text-red-600 mt-1">LTD W-2 issuer selection is required</div>
                  </div>

                  <ng-container *ngIf="disabilityTaxForm.get('ltd_w2_issuer')?.value === 'metlife'">
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <label class="text-sm font-medium text-slate-700">Are you using a payroll vendor?</label>
                      <mat-radio-group formControlName="ltd_payroll_vendor" class="flex gap-6">
                        <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                        <mat-radio-button value="no" color="primary">No</mat-radio-button>
                      </mat-radio-group>
                      <div *ngIf="disabilityTaxForm.get('ltd_payroll_vendor')?.touched && disabilityTaxForm.get('ltd_payroll_vendor')?.invalid"
                           class="text-xs text-red-600 mt-1">LTD payroll vendor selection is required</div>
                    </div>

                    <div *ngIf="disabilityTaxForm.get('ltd_payroll_vendor')?.value === 'yes'"
                         class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <mat-checkbox formControlName="ltd_terms_accepted" color="primary">
                        <span class="text-sm text-slate-700">
                          I agree to the terms for payroll vendor tax reporting arrangements for LTD.
                        </span>
                      </mat-checkbox>
                      <div *ngIf="disabilityTaxForm.get('ltd_terms_accepted')?.touched && disabilityTaxForm.get('ltd_terms_accepted')?.invalid"
                           class="text-xs text-red-600 mt-1">LTD payroll vendor terms acceptance is required</div>
                    </div>
                  </ng-container>
                </div>

                <!-- STD Section -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h4 class="text-sm font-semibold text-slate-800">Short Term Disability (STD)</h4>

                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">Who issues the disability W-2?</label>
                    <mat-radio-group formControlName="std_w2_issuer" class="flex gap-6">
                      <mat-radio-button value="customer" color="primary">Customer</mat-radio-button>
                      <mat-radio-button value="metlife" color="primary">MetLife</mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="disabilityTaxForm.get('std_w2_issuer')?.touched && disabilityTaxForm.get('std_w2_issuer')?.invalid"
                         class="text-xs text-red-600 mt-1">STD W-2 issuer selection is required</div>
                  </div>

                  <ng-container *ngIf="disabilityTaxForm.get('std_w2_issuer')?.value === 'metlife'">
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <label class="text-sm font-medium text-slate-700">Are you using a payroll vendor?</label>
                      <mat-radio-group formControlName="std_payroll_vendor" class="flex gap-6">
                        <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                        <mat-radio-button value="no" color="primary">No</mat-radio-button>
                      </mat-radio-group>
                      <div *ngIf="disabilityTaxForm.get('std_payroll_vendor')?.touched && disabilityTaxForm.get('std_payroll_vendor')?.invalid"
                           class="text-xs text-red-600 mt-1">STD payroll vendor selection is required</div>
                    </div>

                    <div *ngIf="disabilityTaxForm.get('std_payroll_vendor')?.value === 'yes'"
                         class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <mat-checkbox formControlName="std_terms_accepted" color="primary">
                        <span class="text-sm text-slate-700">
                          I agree to the terms for payroll vendor tax reporting arrangements for STD.
                        </span>
                      </mat-checkbox>
                      <div *ngIf="disabilityTaxForm.get('std_terms_accepted')?.touched && disabilityTaxForm.get('std_terms_accepted')?.invalid"
                           class="text-xs text-red-600 mt-1">STD payroll vendor terms acceptance is required</div>
                    </div>
                  </ng-container>
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

        <!-- SUB-STEP 8: Certificate of Beneficial Interest -->
        <mat-step [stepControl]="certBeneficialForm" label="Certificate of Beneficial Interest">
          <form [formGroup]="certBeneficialForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Certificate of Beneficial Interest</h3>

                <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                  <p class="text-sm text-blue-800">
                    This section applies when Life products with portability are sold (not applicable for Alaska).
                  </p>
                </div>

                <button mat-button class="text-indigo-600" type="button">
                  <mat-icon>open_in_new</mat-icon> View Portability Trust Participation Agreement
                </button>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="portability_agreement_acknowledged" color="primary">
                    <span class="text-sm text-slate-700">
                      I acknowledge and agree to the Portability Trust Participation Agreement.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="certBeneficialForm.get('portability_agreement_acknowledged')?.touched && certBeneficialForm.get('portability_agreement_acknowledged')?.invalid"
                       class="text-xs text-red-600 mt-1">Portability agreement acknowledgement is required</div>
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

        <!-- SUB-STEP 9: No Claims -->
        <mat-step [stepControl]="noClaimsForm" label="No Claims">
          <form [formGroup]="noClaimsForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">No Claims Certification</h3>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Do you certify that no claims have been incurred between the coverage
                    effective date and the current date?
                  </label>
                  <mat-radio-group formControlName="claims_status" class="flex flex-col gap-3">
                    <mat-radio-button value="no_claims" color="primary">
                      No claims have been incurred
                    </mat-radio-button>
                    <mat-radio-button value="claims_incurred" color="primary">
                      Claims have been incurred
                    </mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="noClaimsForm.get('claims_status')?.touched && noClaimsForm.get('claims_status')?.invalid"
                       class="text-xs text-red-600 mt-1">Claims status selection is required</div>
                </div>

                <!-- Claims Table (shown when claims incurred) -->
                <ng-container *ngIf="noClaimsForm.get('claims_status')?.value === 'claims_incurred'">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-slate-700">Claim Information</h4>
                      <button mat-flat-button color="primary" (click)="addClaim()" style="border-radius: 8px;" type="button">
                        <mat-icon>add</mat-icon> Add Another Claim
                      </button>
                    </div>

                    <div *ngIf="claims.length === 0"
                         class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">assignment</mat-icon>
                      <p class="text-slate-400 text-sm">No claims added yet</p>
                      <p class="text-slate-300 text-xs">Click "Add Another Claim" to get started</p>
                    </div>

                    <table *ngIf="claims.length > 0" mat-table [dataSource]="claims" class="w-full">
                      <ng-container matColumnDef="product">
                        <th mat-header-cell *matHeaderCellDef>Product</th>
                        <td mat-cell *matCellDef="let c">{{ c.product }}</td>
                      </ng-container>
                      <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef>Date</th>
                        <td mat-cell *matCellDef="let c">{{ c.date }}</td>
                      </ng-container>
                      <ng-container matColumnDef="nature">
                        <th mat-header-cell *matHeaderCellDef>Nature</th>
                        <td mat-cell *matCellDef="let c">{{ c.nature }}</td>
                      </ng-container>
                      <ng-container matColumnDef="additional_comments">
                        <th mat-header-cell *matHeaderCellDef>Comments</th>
                        <td mat-cell *matCellDef="let c">{{ c.additional_comments }}</td>
                      </ng-container>
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef class="w-20"></th>
                        <td mat-cell *matCellDef="let c; let i = index">
                          <button mat-icon-button matTooltip="Edit" (click)="editClaim(i)" type="button">
                            <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                          </button>
                          <button mat-icon-button matTooltip="Delete" (click)="removeClaim(i)" type="button">
                            <mat-icon class="text-red-400" style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="claimColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: claimColumns;"></tr>
                    </table>
                  </div>

                  <!-- Inline Claim Form -->
                  <div *ngIf="showClaimForm" class="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-indigo-700">
                        {{ editingClaimIndex >= 0 ? 'Edit' : 'Add' }} Claim
                      </h4>
                      <button mat-icon-button (click)="cancelClaimForm()" type="button">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>

                    <form [formGroup]="claimDetailForm" class="space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Product</mat-label>
                          <mat-select formControlName="product">
                            <mat-option *ngFor="let p of claimProductOptions" [value]="p">{{ p }}</mat-option>
                          </mat-select>
                          <mat-error>Required</mat-error>
                        </mat-form-field>
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Date</mat-label>
                          <input matInput type="date" formControlName="date">
                          <mat-error>Required</mat-error>
                        </mat-form-field>
                      </div>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Nature of Claim</mat-label>
                        <input matInput formControlName="nature">
                        <mat-error>Required</mat-error>
                      </mat-form-field>
                      <mat-form-field class="w-full" appearance="outline">
                        <mat-label>Additional Comments</mat-label>
                        <textarea matInput formControlName="additional_comments" rows="2"></textarea>
                      </mat-form-field>
                      <div class="flex justify-end gap-3">
                        <button mat-button type="button" (click)="cancelClaimForm()">Cancel</button>
                        <button mat-flat-button color="primary" type="button"
                                (click)="saveClaimDetail()" [disabled]="claimDetailForm.invalid"
                                style="border-radius: 8px;">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </ng-container>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="customer_esign" color="primary">
                    <span class="text-sm text-slate-700">
                      I certify, as an authorized representative of the group, that the above
                      information regarding claims is true and complete.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="noClaimsForm.get('customer_esign')?.touched && noClaimsForm.get('customer_esign')?.invalid"
                       class="text-xs text-red-600 mt-1">Claims certification e-signature is required</div>
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

        <!-- SUB-STEP 10: Final E-Sign -->
        <mat-step [stepControl]="finalSignatureForm" label="Final Signature">
          <form [formGroup]="finalSignatureForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Final Electronic Signature</h3>

                <p class="text-sm text-slate-500">
                  Please review and confirm all authorizations below before signing.
                </p>

                <!-- Summary of completed authorizations -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Authorizations Completed</h4>
                  <ul class="space-y-1">
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Online Access Preferences</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Privacy Notice Acknowledged</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Intermediary &amp; Producer Compensation</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Third Party Billing Agreement</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Gross Up Acknowledgement</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">HIPAA Authorization</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Disability Tax Authorization</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">Certificate of Beneficial Interest</span>
                    </li>
                    <li class="flex items-center gap-2 text-sm">
                      <mat-icon class="text-green-500" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-700">No Claims Certification</span>
                    </li>
                  </ul>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="final_declaration" color="primary">
                    <span class="text-sm text-slate-700">
                      I hereby confirm and understand that the information provided in all preceding
                      authorization sections is true and complete to the best of my knowledge and belief.
                      I understand that by entering my name below and clicking "Submit," I am signing and
                      submitting this document. This is a legally binding electronic signature.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="finalSignatureForm.get('final_declaration')?.touched && finalSignatureForm.get('final_declaration')?.invalid"
                       class="text-xs text-red-600 mt-1">Final declaration is required</div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <p class="text-xs text-slate-400">
                  Note: You cannot make changes after you've clicked Submit. A copy of this document
                  will be available for printing and downloading once enrollment begins.
                </p>
              </mat-card-content>
            </mat-card>
            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
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
export class AuthorizationComponent implements OnInit, OnDestroy {
  // Forms
  onlineAccessForm!: FormGroup;
  privacyForm!: FormGroup;
  intermediaryForm!: FormGroup;
  thirdPartyForm!: FormGroup;
  grossUpForm!: FormGroup;
  hipaaForm!: FormGroup;
  disabilityTaxForm!: FormGroup;
  certBeneficialForm!: FormGroup;
  noClaimsForm!: FormGroup;
  finalSignatureForm!: FormGroup;
  claimDetailForm!: FormGroup;

  // HIPAA state
  employeeTitleOptions = EMPLOYEE_TITLE_OPTIONS;
  hipaaFileUploaded = false;

  // Claims state
  claims: ClaimEntry[] = [];
  showClaimForm = false;
  editingClaimIndex = -1;
  claimColumns = ['product', 'date', 'nature', 'additional_comments', 'actions'];
  claimProductOptions = CLAIM_PRODUCT_OPTIONS;

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
    this.onlineAccessForm = this.fb.group({
      broker_online_access: ['yes', Validators.required],
      document_delivery: ['electronic', Validators.required],
    });

    this.privacyForm = this.fb.group({
      privacy_notice_acknowledged: [false, Validators.requiredTrue],
    });

    this.intermediaryForm = this.fb.group({
      intermediary_notice_received: [false, Validators.requiredTrue],
      producer_compensation_acknowledged: [false, Validators.requiredTrue],
    });

    this.thirdPartyForm = this.fb.group({
      agreement_reviewed: [false, Validators.requiredTrue],
    });

    this.grossUpForm = this.fb.group({
      company_name: [{ value: '', disabled: true }],
      group_number: [{ value: '', disabled: true }],
      gross_up_acknowledged: [false, Validators.requiredTrue],
    });

    this.hipaaForm = this.fb.group({
      phi_access: ['', Validators.required],
      claims_access_option: [''],
      employee_titles: this.fb.array([this.fb.control('', Validators.required)]),
      privacy_officer: ['no'],
      participants_rights: ['no'],
      privacy_complaints: ['no'],
      hipaa_terms_accepted: [false, Validators.requiredTrue],
      esign_declaration: [false, Validators.requiredTrue],
      esign_group_name: ['', Validators.required],
      esign_group_number: ['', Validators.required],
      esign_first_name: ['', Validators.required],
      esign_last_name: ['', Validators.required],
      esign_date: [{ value: new Date().toLocaleDateString('en-US'), disabled: true }],
    });

    this.disabilityTaxForm = this.fb.group({
      ltd_w2_issuer: ['customer', Validators.required],
      ltd_payroll_vendor: [''],
      ltd_terms_accepted: [false],
      std_w2_issuer: ['customer', Validators.required],
      std_payroll_vendor: [''],
      std_terms_accepted: [false],
    });

    this.certBeneficialForm = this.fb.group({
      portability_agreement_acknowledged: [false, Validators.requiredTrue],
    });

    this.noClaimsForm = this.fb.group({
      claims_status: ['no_claims', Validators.required],
      customer_esign: [false, Validators.requiredTrue],
    });

    this.finalSignatureForm = this.fb.group({
      final_declaration: [false, Validators.requiredTrue],
      accepted_by: ['', Validators.required],
      signature_date: [{ value: new Date().toLocaleDateString('en-US'), disabled: true }],
    });

    this.claimDetailForm = this.fb.group({
      product: ['', Validators.required],
      date: ['', Validators.required],
      nature: ['', Validators.required],
      additional_comments: [''],
    });
  }

  private setupConditionalValidators(): void {
    // HIPAA: claims_access_option required when phi_access = yes
    this.hipaaForm.get('phi_access')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const optionCtrl = this.hipaaForm.get('claims_access_option')!;
        if (val === 'yes') {
          optionCtrl.setValidators(Validators.required);
        } else {
          optionCtrl.clearValidators();
          optionCtrl.setValue('');
        }
        optionCtrl.updateValueAndValidity();
      });

    // Disability Tax: LTD payroll vendor + terms conditionals
    this.disabilityTaxForm.get('ltd_w2_issuer')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const vendorCtrl = this.disabilityTaxForm.get('ltd_payroll_vendor')!;
        const termsCtrl = this.disabilityTaxForm.get('ltd_terms_accepted')!;
        if (val === 'metlife') {
          vendorCtrl.setValidators(Validators.required);
        } else {
          vendorCtrl.clearValidators();
          vendorCtrl.setValue('');
          termsCtrl.clearValidators();
          termsCtrl.setValue(false);
        }
        vendorCtrl.updateValueAndValidity();
        termsCtrl.updateValueAndValidity();
      });

    this.disabilityTaxForm.get('ltd_payroll_vendor')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const termsCtrl = this.disabilityTaxForm.get('ltd_terms_accepted')!;
        if (val === 'yes') {
          termsCtrl.setValidators(Validators.requiredTrue);
        } else {
          termsCtrl.clearValidators();
          termsCtrl.setValue(false);
        }
        termsCtrl.updateValueAndValidity();
      });

    // Disability Tax: STD payroll vendor + terms conditionals
    this.disabilityTaxForm.get('std_w2_issuer')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const vendorCtrl = this.disabilityTaxForm.get('std_payroll_vendor')!;
        const termsCtrl = this.disabilityTaxForm.get('std_terms_accepted')!;
        if (val === 'metlife') {
          vendorCtrl.setValidators(Validators.required);
        } else {
          vendorCtrl.clearValidators();
          vendorCtrl.setValue('');
          termsCtrl.clearValidators();
          termsCtrl.setValue(false);
        }
        vendorCtrl.updateValueAndValidity();
        termsCtrl.updateValueAndValidity();
      });

    this.disabilityTaxForm.get('std_payroll_vendor')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const termsCtrl = this.disabilityTaxForm.get('std_terms_accepted')!;
        if (val === 'yes') {
          termsCtrl.setValidators(Validators.requiredTrue);
        } else {
          termsCtrl.clearValidators();
          termsCtrl.setValue(false);
        }
        termsCtrl.updateValueAndValidity();
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['online_access']) this.onlineAccessForm.patchValue(data['online_access']);
    if (data['privacy_notice']) this.privacyForm.patchValue(data['privacy_notice']);
    if (data['intermediary']) this.intermediaryForm.patchValue(data['intermediary']);
    if (data['third_party_billing']) this.thirdPartyForm.patchValue(data['third_party_billing']);
    if (data['gross_up']) this.grossUpForm.patchValue(data['gross_up']);
    if (data['hipaa']) {
      const hipaa = data['hipaa'];
      this.hipaaForm.patchValue(hipaa);
      if (hipaa.employee_titles?.length > 0) {
        this.employeeTitles.clear();
        hipaa.employee_titles.forEach((t: { title: string }) => {
          this.employeeTitles.push(this.fb.control(t.title, Validators.required));
        });
      }
      this.hipaaFileUploaded = hipaa.hipaa_file_uploaded || false;
    }
    if (data['disability_tax']) this.disabilityTaxForm.patchValue(data['disability_tax']);
    if (data['cert_beneficial']) this.certBeneficialForm.patchValue(data['cert_beneficial']);
    if (data['no_claims']) {
      this.noClaimsForm.patchValue(data['no_claims']);
      if (data['no_claims'].claims) {
        this.claims = [...data['no_claims'].claims];
      }
    }
    if (data['final_signature']) this.finalSignatureForm.patchValue(data['final_signature']);
  }

  // --- HIPAA Employee Titles ---
  get employeeTitles(): FormArray {
    return this.hipaaForm.get('employee_titles') as FormArray;
  }

  getEmployeeTitleControl(index: number): FormControl {
    return this.employeeTitles.at(index) as FormControl;
  }

  addEmployeeTitle(): void {
    if (this.employeeTitles.length < 4) {
      this.employeeTitles.push(this.fb.control('', Validators.required));
    }
  }

  removeEmployeeTitle(index: number): void {
    if (this.employeeTitles.length > 1) {
      this.employeeTitles.removeAt(index);
    }
  }

  // --- HIPAA File Upload ---
  onHipaaFileSelected(files: File[]): void {
    this.hipaaFileUploaded = files.length > 0;
  }

  // --- E-Consent Dialog ---
  openEConsent(): void {
    this.dialog.open(EConsentDialogComponent, { width: '550px' });
  }

  // --- Claims Management ---
  addClaim(): void {
    this.editingClaimIndex = -1;
    this.claimDetailForm.reset();
    this.showClaimForm = true;
  }

  editClaim(index: number): void {
    this.editingClaimIndex = index;
    this.claimDetailForm.patchValue(this.claims[index]);
    this.showClaimForm = true;
  }

  removeClaim(index: number): void {
    this.claims = this.claims.filter((_, i) => i !== index);
  }

  saveClaimDetail(): void {
    if (this.claimDetailForm.invalid) return;
    const claim = this.claimDetailForm.value as ClaimEntry;
    if (this.editingClaimIndex >= 0) {
      this.claims = this.claims.map((c, i) => i === this.editingClaimIndex ? claim : c);
    } else {
      this.claims = [...this.claims, claim];
    }
    this.showClaimForm = false;
    this.editingClaimIndex = -1;
  }

  cancelClaimForm(): void {
    this.showClaimForm = false;
    this.editingClaimIndex = -1;
  }

  // --- Data persistence ---
  getData(): Record<string, any> {
    return {
      online_access: this.onlineAccessForm.getRawValue(),
      privacy_notice: this.privacyForm.getRawValue(),
      intermediary: this.intermediaryForm.getRawValue(),
      third_party_billing: this.thirdPartyForm.getRawValue(),
      gross_up: this.grossUpForm.getRawValue(),
      hipaa: {
        ...this.hipaaForm.getRawValue(),
        employee_titles: this.employeeTitles.controls.map(c => ({ title: c.value })),
        hipaa_file_uploaded: this.hipaaFileUploaded,
      },
      disability_tax: this.disabilityTaxForm.getRawValue(),
      cert_beneficial: this.certBeneficialForm.getRawValue(),
      no_claims: {
        ...this.noClaimsForm.getRawValue(),
        claims: this.claims,
      },
      final_signature: this.finalSignatureForm.getRawValue(),
    };
  }

  isValid(): boolean {
    return this.onlineAccessForm.valid
      && this.privacyForm.valid
      && this.intermediaryForm.valid
      && this.thirdPartyForm.valid
      && this.grossUpForm.valid
      && this.hipaaForm.valid
      && this.disabilityTaxForm.valid
      && this.certBeneficialForm.valid
      && this.noClaimsForm.valid
      && this.finalSignatureForm.valid;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    // Online Access
    if (this.onlineAccessForm.get('broker_online_access')?.invalid) {
      errors.push('Online Access: broker online access selection is required.');
    }
    if (this.onlineAccessForm.get('document_delivery')?.invalid) {
      errors.push('Online Access: document delivery preference is required.');
    }

    // Privacy Notice
    if (this.privacyForm.get('privacy_notice_acknowledged')?.invalid) {
      errors.push('Privacy Notice: acknowledgement is required.');
    }

    // Intermediary
    if (this.intermediaryForm.get('intermediary_notice_received')?.invalid) {
      errors.push('Intermediary: notice received acknowledgement is required.');
    }
    if (this.intermediaryForm.get('producer_compensation_acknowledged')?.invalid) {
      errors.push('Intermediary: producer compensation acknowledgement is required.');
    }

    // Third Party
    if (this.thirdPartyForm.get('agreement_reviewed')?.invalid) {
      errors.push('Third Party Billing: agreement review is required.');
    }

    // Gross Up
    if (this.grossUpForm.get('gross_up_acknowledged')?.invalid) {
      errors.push('Gross Up: acknowledgement is required.');
    }

    // HIPAA
    if (this.hipaaForm.get('phi_access')?.invalid) {
      errors.push('HIPAA: PHI access selection is required.');
    }
    if (this.hipaaForm.get('phi_access')?.value === 'yes' && this.hipaaForm.get('claims_access_option')?.invalid) {
      errors.push('HIPAA: claims access option selection is required.');
    }
    if (this.hipaaForm.get('hipaa_terms_accepted')?.invalid) {
      errors.push('HIPAA: terms acceptance is required.');
    }
    if (this.hipaaForm.get('esign_declaration')?.invalid) {
      errors.push('HIPAA: electronic signature declaration is required.');
    }
    if (this.hipaaForm.get('esign_group_name')?.invalid) {
      errors.push('HIPAA: group name is required.');
    }
    if (this.hipaaForm.get('esign_group_number')?.invalid) {
      errors.push('HIPAA: group number is required.');
    }
    if (this.hipaaForm.get('esign_first_name')?.invalid) {
      errors.push('HIPAA: first name is required.');
    }
    if (this.hipaaForm.get('esign_last_name')?.invalid) {
      errors.push('HIPAA: last name is required.');
    }

    // Disability Tax
    if (this.disabilityTaxForm.get('ltd_w2_issuer')?.invalid) {
      errors.push('Disability Tax: LTD W-2 issuer selection is required.');
    }
    if (this.disabilityTaxForm.get('ltd_w2_issuer')?.value === 'metlife') {
      if (this.disabilityTaxForm.get('ltd_payroll_vendor')?.invalid) {
        errors.push('Disability Tax: LTD payroll vendor selection is required.');
      }
      if (this.disabilityTaxForm.get('ltd_terms_accepted')?.invalid) {
        errors.push('Disability Tax: LTD payroll vendor terms acceptance is required.');
      }
    }
    if (this.disabilityTaxForm.get('std_w2_issuer')?.invalid) {
      errors.push('Disability Tax: STD W-2 issuer selection is required.');
    }
    if (this.disabilityTaxForm.get('std_w2_issuer')?.value === 'metlife') {
      if (this.disabilityTaxForm.get('std_payroll_vendor')?.invalid) {
        errors.push('Disability Tax: STD payroll vendor selection is required.');
      }
      if (this.disabilityTaxForm.get('std_terms_accepted')?.invalid) {
        errors.push('Disability Tax: STD payroll vendor terms acceptance is required.');
      }
    }

    // Certificate of Beneficial Interest
    if (this.certBeneficialForm.get('portability_agreement_acknowledged')?.invalid) {
      errors.push('Certificate of Beneficial Interest: portability agreement acknowledgement is required.');
    }

    // No Claims
    if (this.noClaimsForm.get('claims_status')?.invalid) {
      errors.push('No Claims: claims status selection is required.');
    }
    if (this.noClaimsForm.get('customer_esign')?.invalid) {
      errors.push('No Claims: certification e-signature is required.');
    }

    // Final Signature
    if (this.finalSignatureForm.get('final_declaration')?.invalid) {
      errors.push('Final Signature: declaration is required.');
    }
    if (this.finalSignatureForm.get('accepted_by')?.invalid) {
      errors.push('Final Signature: accepted by name is required.');
    }

    return errors;
  }

  markFormsAsTouched(): void {
    this.onlineAccessForm.markAllAsTouched();
    this.privacyForm.markAllAsTouched();
    this.intermediaryForm.markAllAsTouched();
    this.thirdPartyForm.markAllAsTouched();
    this.grossUpForm.markAllAsTouched();
    this.hipaaForm.markAllAsTouched();
    this.disabilityTaxForm.markAllAsTouched();
    this.certBeneficialForm.markAllAsTouched();
    this.noClaimsForm.markAllAsTouched();
    this.finalSignatureForm.markAllAsTouched();
  }
}
