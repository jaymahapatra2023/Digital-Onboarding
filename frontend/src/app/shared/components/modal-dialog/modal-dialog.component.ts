import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="text-lg font-semibold">{{ title }}</h2>
    <mat-dialog-content class="py-4">
      <ng-content></ng-content>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2 pb-4 px-6">
      <ng-content select="[actions]"></ng-content>
    </mat-dialog-actions>
  `,
})
export class ModalDialogComponent {
  @Input() title: string = '';
}
