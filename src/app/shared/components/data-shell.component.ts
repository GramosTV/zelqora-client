import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './loading.component';

@Component({
  selector: 'app-data-shell',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    <ng-container *ngIf="isLoading">
      <app-loading [message]="loadingMessage" [fullHeight]="true"></app-loading>
    </ng-container>

    <ng-container *ngIf="!isLoading && error">
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <div class="text-red-500 text-5xl mb-4">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">{{ errorTitle }}</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          *ngIf="showRetry"
          (click)="retryEvent.emit()"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
        >
          Try Again
        </button>
      </div>
    </ng-container>

    <ng-container *ngIf="!isLoading && !error && isEmpty">
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <div class="text-gray-400 text-5xl mb-4">
          <i class="far fa-folder-open"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">{{ emptyTitle }}</h3>
        <p class="text-gray-600">{{ emptyMessage }}</p>
        <ng-container *ngIf="emptyTemplate">
          <ng-container *ngTemplateOutlet="emptyTemplate"></ng-container>
        </ng-container>
      </div>
    </ng-container>

    <ng-container *ngIf="!isLoading && !error && !isEmpty">
      <ng-content></ng-content>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 200px;
      }
    `,
  ],
})
export class DataShellComponent {
  @Input() isLoading = false;
  @Input() isEmpty = false;
  @Input() error: string | null = null;
  @Input() loadingMessage = 'Loading data...';
  @Input() emptyTitle = 'No Data Found';
  @Input() emptyMessage = 'There are no items to display at this time.';
  @Input() errorTitle = 'Something went wrong';
  @Input() showRetry = true;
  @Input() retryEvent = new EventEmitter<void>();

  @ContentChild('emptyTemplate') emptyTemplate?: TemplateRef<any>;
}
