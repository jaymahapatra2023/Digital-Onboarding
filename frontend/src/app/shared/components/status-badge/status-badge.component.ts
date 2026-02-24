import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium">
      <span [class]="dotClasses" class="w-1.5 h-1.5 rounded-full"></span>
      {{ displayLabel }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() label?: string;

  get displayLabel(): string {
    return this.label || this.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get badgeClasses(): string {
    const statusMap: Record<string, string> = {
      'APPLICATION_NOT_STARTED': 'bg-gray-100 text-gray-700',
      'NOT_STARTED': 'bg-gray-100 text-gray-700',
      'APPLICATION_IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'ACTIVE': 'bg-green-100 text-green-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'INACTIVE': 'bg-red-100 text-red-700',
      'OFFLINE': 'bg-orange-100 text-orange-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'SKIPPED': 'bg-purple-100 text-purple-700',
      'NOT_APPLICABLE': 'bg-gray-100 text-gray-500',
    };
    return statusMap[this.status] || 'bg-gray-100 text-gray-600';
  }

  get dotClasses(): string {
    const dotMap: Record<string, string> = {
      'APPLICATION_NOT_STARTED': 'bg-gray-400',
      'NOT_STARTED': 'bg-gray-400',
      'APPLICATION_IN_PROGRESS': 'bg-blue-500',
      'IN_PROGRESS': 'bg-blue-500',
      'ACTIVE': 'bg-green-500',
      'COMPLETED': 'bg-green-500',
      'INACTIVE': 'bg-red-500',
      'OFFLINE': 'bg-orange-500',
      'PENDING': 'bg-yellow-500',
      'SKIPPED': 'bg-purple-500',
      'NOT_APPLICABLE': 'bg-gray-400',
    };
    return dotMap[this.status] || 'bg-gray-400';
  }
}
