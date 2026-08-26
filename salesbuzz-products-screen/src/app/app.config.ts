import { ApplicationConfig, importProvidersFrom, inject, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NavInfo } from 'bi-interfaces';
import { CreateDialog } from 'bi-modules';
import { MessageService } from '@progress/kendo-angular-l10n';
import { MatDialog } from '@angular/material/dialog';

import { routes } from './app.routes';

class AppNavInfo extends NavInfo {
  getBUDesc(_BUID: string): any {
    return '';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(TranslateModule.forRoot()),
    { provide: NavInfo, useClass: AppNavInfo },
    { provide: 'CreateDialog', useFactory: () => { inject(MatDialog); return () => new CreateDialog(); } },
    { provide: LOCALE_ID, useValue: 'en' },
    MessageService,
    DecimalPipe
  ]
};