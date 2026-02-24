import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

      <mat-stepper #stepper class="bg-transparent">

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

                <div class="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors"
                     [ngClass]="documentGates['privacy_notice'] ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
                     (click)="openDocumentDialog('privacy_notice')">
                  <mat-icon [ngClass]="documentGates['privacy_notice'] ? 'text-green-600' : 'text-blue-600'" class="mt-0.5"
                            style="font-size:20px;width:20px;height:20px;">
                    {{ documentGates['privacy_notice'] ? 'check_circle' : 'description' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium" [ngClass]="documentGates['privacy_notice'] ? 'text-green-800' : 'text-blue-800'">
                      {{ documentGates['privacy_notice'] ? 'Privacy Notice Reviewed' : 'View and Download the Privacy Notice' }}
                    </p>
                    <p class="text-xs mt-1" [ngClass]="documentGates['privacy_notice'] ? 'text-green-600' : 'text-blue-600'">
                      {{ documentGates['privacy_notice'] ? 'Click to review again' : 'You must review the privacy notice before acknowledging below.' }}
                    </p>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="privacy_notice_acknowledged" color="primary"
                                [disabled]="!documentGates['privacy_notice']">
                    <span class="text-sm text-slate-700">
                      By checking this box, I, in my capacity as the employer, certify that the Privacy Notice
                      has been distributed to all covered persons within the group.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="!documentGates['privacy_notice'] && privacyForm.get('privacy_notice_acknowledged')?.touched"
                       class="text-xs text-amber-600 mt-1">You must open and read the Privacy Notice before checking this box</div>
                  <div *ngIf="documentGates['privacy_notice'] && privacyForm.get('privacy_notice_acknowledged')?.touched && privacyForm.get('privacy_notice_acknowledged')?.invalid"
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

                <div class="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors"
                     [ngClass]="documentGates['intermediary_notice'] ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
                     (click)="openDocumentDialog('intermediary_notice')">
                  <mat-icon [ngClass]="documentGates['intermediary_notice'] ? 'text-green-600' : 'text-blue-600'" class="mt-0.5"
                            style="font-size:20px;width:20px;height:20px;">
                    {{ documentGates['intermediary_notice'] ? 'check_circle' : 'description' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium" [ngClass]="documentGates['intermediary_notice'] ? 'text-green-800' : 'text-blue-800'">
                      {{ documentGates['intermediary_notice'] ? 'Intermediary Compensation Notice Reviewed' : 'View the Intermediary Compensation Notice' }}
                    </p>
                    <p class="text-xs mt-1" [ngClass]="documentGates['intermediary_notice'] ? 'text-green-600' : 'text-blue-600'">
                      {{ documentGates['intermediary_notice'] ? 'Click to review again' : 'You must review this notice before acknowledging below.' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors"
                     [ngClass]="documentGates['producer_compensation'] ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
                     (click)="openDocumentDialog('producer_compensation')">
                  <mat-icon [ngClass]="documentGates['producer_compensation'] ? 'text-green-600' : 'text-blue-600'" class="mt-0.5"
                            style="font-size:20px;width:20px;height:20px;">
                    {{ documentGates['producer_compensation'] ? 'check_circle' : 'description' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium" [ngClass]="documentGates['producer_compensation'] ? 'text-green-800' : 'text-blue-800'">
                      {{ documentGates['producer_compensation'] ? 'Producer Compensation Disclosure Reviewed' : 'View the Producer Compensation Disclosure' }}
                    </p>
                    <p class="text-xs mt-1" [ngClass]="documentGates['producer_compensation'] ? 'text-green-600' : 'text-blue-600'">
                      {{ documentGates['producer_compensation'] ? 'Click to review again' : 'You must review this disclosure before acknowledging below.' }}
                    </p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <mat-checkbox formControlName="intermediary_notice_received" color="primary"
                                  [disabled]="!documentGates['intermediary_notice']">
                      <span class="text-sm text-slate-700">
                        I certify that I have received a copy of the Intermediary Compensation Notice.
                      </span>
                    </mat-checkbox>
                    <div *ngIf="!documentGates['intermediary_notice'] && intermediaryForm.get('intermediary_notice_received')?.touched"
                         class="text-xs text-amber-600 mt-1">You must open and read the Intermediary Compensation Notice first</div>
                    <div *ngIf="documentGates['intermediary_notice'] && intermediaryForm.get('intermediary_notice_received')?.touched && intermediaryForm.get('intermediary_notice_received')?.invalid"
                         class="text-xs text-red-600 mt-1">Intermediary notice acknowledgement is required</div>
                  </div>

                  <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <mat-checkbox formControlName="producer_compensation_acknowledged" color="primary"
                                  [disabled]="!documentGates['producer_compensation']">
                      <span class="text-sm text-slate-700">
                        I acknowledge the Producer Compensation Disclosure and understand the compensation
                        arrangements described therein.
                      </span>
                    </mat-checkbox>
                    <div *ngIf="!documentGates['producer_compensation'] && intermediaryForm.get('producer_compensation_acknowledged')?.touched"
                         class="text-xs text-amber-600 mt-1">You must open and read the Producer Compensation Disclosure first</div>
                    <div *ngIf="documentGates['producer_compensation'] && intermediaryForm.get('producer_compensation_acknowledged')?.touched && intermediaryForm.get('producer_compensation_acknowledged')?.invalid"
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

                <div class="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors"
                     [ngClass]="documentGates['third_party_agreement'] ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
                     (click)="openDocumentDialog('third_party_agreement')">
                  <mat-icon [ngClass]="documentGates['third_party_agreement'] ? 'text-green-600' : 'text-indigo-600'" class="mt-0.5"
                            style="font-size:20px;width:20px;height:20px;">
                    {{ documentGates['third_party_agreement'] ? 'check_circle' : 'download' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium" [ngClass]="documentGates['third_party_agreement'] ? 'text-green-800' : 'text-indigo-700'">
                      {{ documentGates['third_party_agreement'] ? 'Confirmation & Agreement Form Reviewed' : 'Download the Confirmation & Agreement form' }}
                    </p>
                    <p class="text-xs mt-1" [ngClass]="documentGates['third_party_agreement'] ? 'text-green-600' : 'text-blue-600'">
                      {{ documentGates['third_party_agreement'] ? 'Click to review again' : 'You must review this form before confirming below.' }}
                    </p>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="agreement_reviewed" color="primary"
                                [disabled]="!documentGates['third_party_agreement']">
                    <span class="text-sm text-slate-700">
                      I confirm I have reviewed the Confirmation &amp; Agreement form for third party billing.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="!documentGates['third_party_agreement'] && thirdPartyForm.get('agreement_reviewed')?.touched"
                       class="text-xs text-amber-600 mt-1">You must open and read the Confirmation & Agreement form first</div>
                  <div *ngIf="documentGates['third_party_agreement'] && thirdPartyForm.get('agreement_reviewed')?.touched && thirdPartyForm.get('agreement_reviewed')?.invalid"
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
                        <span class="text-sm">Option A: Include Lincoln Financial HIPAA language in the group application</span>
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
                      <mat-radio-button value="lincoln_financial" color="primary">Lincoln Financial</mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="disabilityTaxForm.get('ltd_w2_issuer')?.touched && disabilityTaxForm.get('ltd_w2_issuer')?.invalid"
                         class="text-xs text-red-600 mt-1">LTD W-2 issuer selection is required</div>
                  </div>

                  <ng-container *ngIf="disabilityTaxForm.get('ltd_w2_issuer')?.value === 'lincoln_financial'">
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
                      <mat-radio-button value="lincoln_financial" color="primary">Lincoln Financial</mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="disabilityTaxForm.get('std_w2_issuer')?.touched && disabilityTaxForm.get('std_w2_issuer')?.invalid"
                         class="text-xs text-red-600 mt-1">STD W-2 issuer selection is required</div>
                  </div>

                  <ng-container *ngIf="disabilityTaxForm.get('std_w2_issuer')?.value === 'lincoln_financial'">
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

                <div class="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-colors"
                     [ngClass]="documentGates['portability_agreement'] ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
                     (click)="openDocumentDialog('portability_agreement')">
                  <mat-icon [ngClass]="documentGates['portability_agreement'] ? 'text-green-600' : 'text-indigo-600'" class="mt-0.5"
                            style="font-size:20px;width:20px;height:20px;">
                    {{ documentGates['portability_agreement'] ? 'check_circle' : 'open_in_new' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium" [ngClass]="documentGates['portability_agreement'] ? 'text-green-800' : 'text-indigo-700'">
                      {{ documentGates['portability_agreement'] ? 'Portability Trust Participation Agreement Reviewed' : 'View Portability Trust Participation Agreement' }}
                    </p>
                    <p class="text-xs mt-1" [ngClass]="documentGates['portability_agreement'] ? 'text-green-600' : 'text-blue-600'">
                      {{ documentGates['portability_agreement'] ? 'Click to review again' : 'You must review this agreement before acknowledging below.' }}
                    </p>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <mat-checkbox formControlName="portability_agreement_acknowledged" color="primary"
                                [disabled]="!documentGates['portability_agreement']">
                    <span class="text-sm text-slate-700">
                      I acknowledge and agree to the Portability Trust Participation Agreement.
                    </span>
                  </mat-checkbox>
                  <div *ngIf="!documentGates['portability_agreement'] && certBeneficialForm.get('portability_agreement_acknowledged')?.touched"
                       class="text-xs text-amber-600 mt-1">You must open and read the Portability Trust Participation Agreement first</div>
                  <div *ngIf="documentGates['portability_agreement'] && certBeneficialForm.get('portability_agreement_acknowledged')?.touched && certBeneficialForm.get('portability_agreement_acknowledged')?.invalid"
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

  // Document gates: user must open/view each document before checking the associated checkbox
  documentGates: Record<string, boolean> = {
    privacy_notice: false,
    intermediary_notice: false,
    producer_compensation: false,
    third_party_agreement: false,
    portability_agreement: false,
  };

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

    // Must run AFTER patchSavedData — it recreates employee title controls
    // with Validators.required, so we need to clear/restore based on current state.
    this.updateEmployeeTitleValidators();
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
        this.updateEmployeeTitleValidators();
      });

    // HIPAA: employee_titles validators depend on claims_access_option
    this.hipaaForm.get('claims_access_option')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateEmployeeTitleValidators();
      });

    // Disability Tax: LTD payroll vendor + terms conditionals
    this.disabilityTaxForm.get('ltd_w2_issuer')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const vendorCtrl = this.disabilityTaxForm.get('ltd_payroll_vendor')!;
        const termsCtrl = this.disabilityTaxForm.get('ltd_terms_accepted')!;
        if (val === 'lincoln_financial') {
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
        if (val === 'lincoln_financial') {
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
    if (data['document_gates']) {
      this.documentGates = { ...this.documentGates, ...data['document_gates'] };
    }
  }

  private updateEmployeeTitleValidators(): void {
    const phiAccess = this.hipaaForm.get('phi_access')!.value;
    const claimsOption = this.hipaaForm.get('claims_access_option')!.value;
    const needsValidation = phiAccess === 'yes' && claimsOption === 'option_a';

    this.employeeTitles.controls.forEach(c => {
      if (needsValidation) {
        c.setValidators(Validators.required);
      } else {
        c.clearValidators();
      }
      c.updateValueAndValidity();
    });
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

  // --- Document Gate Dialogs ---
  openDocumentDialog(gateKey: string): void {
    const ref = this.dialog.open(AuthorizationDocumentDialogComponent, {
      width: '640px',
      maxHeight: '80vh',
      data: { documentKey: gateKey },
    });
    ref.afterClosed().subscribe(() => {
      this.documentGates[gateKey] = true;
    });
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
      document_gates: { ...this.documentGates },
    };
  }

  isValid(): boolean {
    // A disabled form means all its controls are disabled (e.g. document gate
    // checkboxes the user hasn't unlocked yet).  Treat disabled as passing here;
    // getValidationErrors() will report the specific document-gate actions needed.
    const ok = (f: FormGroup) => f.valid || f.disabled;
    return ok(this.onlineAccessForm)
      && ok(this.privacyForm)
      && ok(this.intermediaryForm)
      && ok(this.thirdPartyForm)
      && ok(this.grossUpForm)
      && ok(this.hipaaForm)
      && ok(this.disabilityTaxForm)
      && ok(this.certBeneficialForm)
      && ok(this.noClaimsForm)
      && ok(this.finalSignatureForm);
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    // Helper: a section needs attention if its form is not valid and not fully disabled
    const needsFix = (f: FormGroup) => !f.valid && !f.disabled;

    // 1 — Online Access
    if (needsFix(this.onlineAccessForm)) {
      errors.push('Step 1 – Online Access: complete all required selections.');
    }

    // 2 — Privacy Notice
    if (!this.documentGates['privacy_notice']) {
      errors.push('Step 2 – Privacy Notice: open and review the Privacy Notice document, then check the acknowledgement.');
    } else if (needsFix(this.privacyForm)) {
      errors.push('Step 2 – Privacy Notice: check the acknowledgement checkbox.');
    }

    // 3 — Intermediary & Producer Compensation
    if (!this.documentGates['intermediary_notice'] || !this.documentGates['producer_compensation']) {
      errors.push('Step 3 – Intermediary Compensation: open and review all required documents, then check the acknowledgements.');
    } else if (needsFix(this.intermediaryForm)) {
      errors.push('Step 3 – Intermediary Compensation: check all acknowledgement checkboxes.');
    }

    // 4 — Third Party Billing
    if (!this.documentGates['third_party_agreement']) {
      errors.push('Step 4 – Third Party Billing: open and review the Confirmation & Agreement form, then check the acknowledgement.');
    } else if (needsFix(this.thirdPartyForm)) {
      errors.push('Step 4 – Third Party Billing: check the agreement review checkbox.');
    }

    // 5 — Gross Up
    if (needsFix(this.grossUpForm)) {
      errors.push('Step 5 – Gross Up: check the acknowledgement checkbox.');
    }

    // 6 — HIPAA
    if (needsFix(this.hipaaForm)) {
      const details: string[] = [];
      if (this.hipaaForm.get('phi_access')?.invalid) details.push('select PHI access (Yes/No)');
      if (this.hipaaForm.get('claims_access_option')?.invalid) details.push('select a claims access option');
      if (this.employeeTitles.controls.some(c => c.invalid)) details.push('select employee title(s)');
      if (this.hipaaForm.get('hipaa_terms_accepted')?.invalid) details.push('accept terms');
      if (this.hipaaForm.get('esign_declaration')?.invalid) details.push('check e-signature declaration');
      const esignFields = ['esign_group_name', 'esign_group_number', 'esign_first_name', 'esign_last_name'];
      if (esignFields.some(f => this.hipaaForm.get(f)?.invalid)) details.push('complete e-signature fields');
      errors.push('Step 6 – HIPAA: ' + (details.length > 0 ? details.join(', ') + '.' : 'complete all required fields.'));
    }

    // 7 — Disability Tax
    if (needsFix(this.disabilityTaxForm)) {
      errors.push('Step 7 – Disability Tax: complete all required selections.');
    }

    // 8 — Certificate of Beneficial Interest
    if (!this.documentGates['portability_agreement']) {
      errors.push('Step 8 – Certificate of Beneficial Interest: open and review the Portability Trust Participation Agreement, then check the acknowledgement.');
    } else if (needsFix(this.certBeneficialForm)) {
      errors.push('Step 8 – Certificate of Beneficial Interest: check the acknowledgement checkbox.');
    }

    // 9 — No Claims
    if (needsFix(this.noClaimsForm)) {
      const details: string[] = [];
      if (this.noClaimsForm.get('claims_status')?.invalid) details.push('select claims status');
      if (this.noClaimsForm.get('customer_esign')?.invalid) details.push('check the certification e-signature');
      errors.push('Step 9 – No Claims: ' + (details.length > 0 ? details.join(', ') + '.' : 'complete all required fields.'));
    }

    // 10 — Final Signature
    if (needsFix(this.finalSignatureForm)) {
      const details: string[] = [];
      if (this.finalSignatureForm.get('final_declaration')?.invalid) details.push('check the final declaration');
      if (this.finalSignatureForm.get('accepted_by')?.invalid) details.push('enter your name in "Accepted By"');
      errors.push('Step 10 – Final Signature: ' + (details.length > 0 ? details.join(', ') + '.' : 'complete all required fields.'));
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

// ---------------------------------------------------------------------------
// Document Dialog — displays the content for each gated document
// ---------------------------------------------------------------------------

interface DocumentContent {
  title: string;
  icon: string;
  sections: { heading: string; body: string }[];
}

const DOCUMENT_CONTENT: Record<string, DocumentContent> = {
  privacy_notice: {
    title: 'Privacy Notice',
    icon: 'privacy_tip',
    sections: [
      { heading: '1. Information We Collect', body: 'Lincoln National Corporation ("Lincoln Financial") collects personal information from group insurance applicants and participants, including but not limited to: names, addresses, Social Security numbers, dates of birth, employment information, salary data, beneficiary designations, and health-related information as necessary to administer group insurance benefits.' },
      { heading: '2. How We Use Your Information', body: 'Personal information is used to evaluate eligibility, underwrite and administer group insurance policies, process claims, and comply with legal and regulatory requirements. We may also use information for fraud prevention and detection purposes.' },
      { heading: '3. Information Sharing', body: 'Lincoln Financial may share personal information with affiliated companies, reinsurers, third-party administrators, and service providers as necessary to administer your group insurance benefits. We may also share information as required by law, regulation, or legal process.' },
      { heading: '4. Information Security', body: 'Lincoln Financial maintains physical, electronic, and procedural safeguards to protect personal information. Access to personal information is limited to employees and service providers who need it to perform their job functions.' },
      { heading: '5. Your Rights', body: 'You have the right to access, correct, and request deletion of your personal information, subject to applicable law. You may also opt out of certain uses of your information. To exercise these rights, contact Lincoln Financial\'s Privacy Office.' },
      { heading: '6. Distribution Requirement', body: 'As the employer/plan sponsor, you are required to distribute this Privacy Notice to all covered persons within your group. By acknowledging this notice, you certify that you have fulfilled this distribution requirement.' },
    ],
  },
  intermediary_notice: {
    title: 'Intermediary Compensation Notice',
    icon: 'payments',
    sections: [
      { heading: '1. Purpose', body: 'This notice provides information about the compensation arrangements between Lincoln National Corporation ("Lincoln Financial") and the intermediaries (brokers, agents, and consultants) involved in the sale and servicing of your group insurance products.' },
      { heading: '2. Types of Compensation', body: 'Intermediaries may receive various forms of compensation from Lincoln Financial, including but not limited to: commissions based on premiums, service fees, bonuses or overrides based on volume or persistency, non-cash compensation such as trips or awards, and expense reimbursements.' },
      { heading: '3. Compensation Ranges', body: 'Commission rates typically range from 2% to 10% of premium, depending on the product type, group size, and market conditions. Additional compensation may be paid based on production volume, retention rates, or other performance metrics.' },
      { heading: '4. Potential Conflicts of Interest', body: 'The compensation arrangements described above may create incentives for intermediaries to recommend certain products or insurance carriers over others. You should consider these potential conflicts when evaluating recommendations from your intermediary.' },
      { heading: '5. Additional Information', body: 'You may request additional details about the compensation paid to your specific intermediary by contacting Lincoln Financial\'s Group Benefits customer service team. Your intermediary is also obligated to disclose compensation information upon request.' },
    ],
  },
  producer_compensation: {
    title: 'Producer Compensation Disclosure',
    icon: 'account_balance',
    sections: [
      { heading: '1. Disclosure Statement', body: 'This disclosure is provided pursuant to applicable state and federal regulations requiring transparency in insurance producer compensation arrangements.' },
      { heading: '2. Direct Compensation', body: 'The producer(s) involved in this transaction will receive direct compensation from Lincoln Financial in the form of commissions. The specific commission rate and structure are detailed in the Commission Acknowledgement section of this application.' },
      { heading: '3. Indirect Compensation', body: 'In addition to direct commissions, the producer or their agency may receive indirect compensation from Lincoln Financial, including but not limited to: override commissions, contingent commissions based on block performance, marketing allowances, and access to tools and technology platforms.' },
      { heading: '4. ERISA Compliance', body: 'For group health plans subject to ERISA, this disclosure is provided in accordance with ERISA Section 408(b)(2) and Department of Labor regulations requiring disclosure of direct and indirect compensation received by service providers.' },
      { heading: '5. Right to Additional Information', body: 'You have the right to request additional information about the compensation arrangements described herein. Please contact your producer or Lincoln Financial\'s Group Benefits department for more details.' },
    ],
  },
  third_party_agreement: {
    title: 'Third Party Billing Confirmation & Agreement',
    icon: 'receipt_long',
    sections: [
      { heading: '1. Agreement Purpose', body: 'This Confirmation & Agreement establishes the terms under which a third party has been designated to receive and remit premium billing on behalf of the group policyholder to Lincoln National Corporation ("Lincoln Financial").' },
      { heading: '2. Third Party Responsibilities', body: 'The designated third party agrees to: receive monthly premium billing statements from Lincoln Financial, collect premiums from the group policyholder, remit collected premiums to Lincoln Financial by the due date specified on the billing statement, maintain accurate records of all premium transactions, and promptly notify Lincoln Financial of any changes in the billing arrangement.' },
      { heading: '3. Policyholder Responsibilities', body: 'The group policyholder remains ultimately responsible for the timely payment of all premiums due under the group policy, regardless of the third-party billing arrangement. The policyholder agrees to monitor premium payments and ensure compliance with policy terms.' },
      { heading: '4. Lincoln Financial Rights', body: 'Lincoln Financial reserves the right to: terminate the third-party billing arrangement upon 30 days written notice, pursue collection of unpaid premiums directly from the group policyholder, and modify billing procedures as necessary for accurate premium administration.' },
      { heading: '5. Liability', body: 'Neither Lincoln Financial nor the group policyholder shall be liable for errors or delays caused by the designated third party in the processing of premium payments, provided that reasonable efforts have been made to ensure timely payment.' },
    ],
  },
  portability_agreement: {
    title: 'Portability Trust Participation Agreement',
    icon: 'verified_user',
    sections: [
      { heading: '1. Overview', body: 'This Portability Trust Participation Agreement ("Agreement") governs the terms under which eligible employees may continue their life insurance coverage under the Lincoln Financial Portability Trust after termination of employment or cessation of group coverage.' },
      { heading: '2. Eligibility', body: 'Employees who are insured under the group life insurance policy at the time of termination of employment (or group coverage cessation) are eligible to port their coverage to the Lincoln Financial Portability Trust, subject to applicable terms and conditions.' },
      { heading: '3. Coverage Terms', body: 'Ported coverage is issued under the terms of the Lincoln Financial Portability Trust policy, which may differ from the group policy terms. Premium rates for ported coverage are based on the individual\'s age at the time of porting and are subject to adjustment.' },
      { heading: '4. Employer Obligations', body: 'The employer agrees to: notify terminating employees of their portability rights within 31 days of the qualifying event, provide the required portability enrollment forms, and cooperate with Lincoln Financial in administering portability elections.' },
      { heading: '5. Trust Administration', body: 'The Lincoln Financial Portability Trust is administered by Lincoln Financial as trustee. All ported coverage is subject to the trust agreement and applicable state insurance regulations. The employer has no ongoing obligations with respect to ported coverage after the employee\'s election period.' },
    ],
  },
};

@Component({
  selector: 'app-authorization-document-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">{{ content.icon }}</mat-icon>
        </div>
        <h2 class="text-lg font-bold text-slate-900">{{ content.title }}</h2>
      </div>

      <mat-dialog-content class="py-5">
        <div class="prose prose-sm max-w-none text-slate-700 space-y-4">
          <div *ngFor="let section of content.sections">
            <h4 class="text-sm font-semibold text-slate-900">{{ section.heading }}</h4>
            <p>{{ section.body }}</p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-flat-button color="primary" [mat-dialog-close]="true" style="border-radius: 8px;">
          I Have Read This Document
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AuthorizationDocumentDialogComponent {
  content: DocumentContent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { documentKey: string },
  ) {
    this.content = DOCUMENT_CONTENT[data.documentKey] || {
      title: 'Document',
      icon: 'description',
      sections: [{ heading: '', body: 'Document content is not available.' }],
    };
  }
}
