import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workflow-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-slate-700">Progress</span>
        <span class="text-sm text-slate-500">
          <span class="font-bold text-indigo-600">{{ completed }}</span> / {{ total }} steps
        </span>
      </div>
      <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500 ease-out"
             style="background: linear-gradient(90deg, #4338ca, #4f46e5, #818cf8);"
             [style.width.%]="percent"></div>
      </div>
    </div>
  `,
})
export class WorkflowProgressComponent {
  @Input() completed: number = 0;
  @Input() total: number = 0;

  get percent(): number {
    return this.total > 0 ? (this.completed / this.total) * 100 : 0;
  }
}
