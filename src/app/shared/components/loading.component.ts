import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center p-4"
      [ngClass]="{ 'h-full': fullHeight }"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
      ></div>
      <p class="mt-3 text-gray-600" *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LoadingComponent {
  @Input() public message = 'Loading...';
  @Input() public fullHeight = false;
}
