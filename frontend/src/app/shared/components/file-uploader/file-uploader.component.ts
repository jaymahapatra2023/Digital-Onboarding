import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div
      class="border-2 border-dashed rounded-xl p-10 text-center transition-all"
      [class.border-indigo-400]="isDragOver"
      [class.bg-indigo-50]="isDragOver"
      [class.border-slate-200]="!isDragOver"
      [class.hover:border-slate-300]="!isDragOver"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)">

      <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <mat-icon class="text-slate-400" style="font-size:28px;width:28px;height:28px;">cloud_upload</mat-icon>
      </div>
      <p class="text-slate-600 mb-3">Drag and drop files here, or</p>
      <button mat-flat-button color="primary" (click)="fileInput.click()" style="border-radius: 8px;">
        Browse Files
      </button>
      <input #fileInput type="file"
        [accept]="acceptedTypes"
        [multiple]="multiple"
        (change)="onFileSelected($event)"
        class="hidden">

      <div class="mt-3 space-y-0.5">
        <p *ngIf="acceptedTypes" class="text-xs text-slate-400">
          Accepted: {{ acceptedTypes }}
        </p>
        <p *ngIf="maxSizeMB" class="text-xs text-slate-400">
          Max size: {{ maxSizeMB }}MB
        </p>
      </div>
    </div>

    <!-- Selected files list -->
    <div *ngIf="selectedFiles.length > 0" class="mt-4 space-y-2">
      <div *ngFor="let file of selectedFiles; let i = index"
           class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-indigo-500" style="font-size:16px;width:16px;height:16px;">description</mat-icon>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">{{ file.name }}</p>
            <p class="text-xs text-slate-400">{{ formatSize(file.size) }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="removeFile(i)" class="text-slate-400 hover:text-red-500">
          <mat-icon style="font-size:18px;width:18px;height:18px;">close</mat-icon>
        </button>
      </div>
    </div>

    <mat-progress-bar *ngIf="uploading" mode="indeterminate" class="mt-3 rounded-full"></mat-progress-bar>
  `,
})
export class FileUploaderComponent {
  @Input() acceptedTypes: string = '';
  @Input() multiple: boolean = false;
  @Input() maxSizeMB: number = 10;
  @Input() uploading: boolean = false;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<number>();

  isDragOver = false;
  selectedFiles: File[] = [];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter(f => f.size <= this.maxSizeMB * 1024 * 1024);
    if (this.multiple) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    } else {
      this.selectedFiles = validFiles.slice(0, 1);
    }
    this.filesSelected.emit(this.selectedFiles);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.fileRemoved.emit(index);
    this.filesSelected.emit(this.selectedFiles);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
