import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="border-t border-gray-100 py-3 px-6 text-center text-xs text-slate-400 bg-white/50">
      &copy; {{ currentYear }} Digital Onboarding Portal
    </footer>
  `,
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
