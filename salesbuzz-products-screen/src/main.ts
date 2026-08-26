import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

console.log('[DEBUG] main.ts executing');
bootstrapApplication(App, appConfig)
  .then(() => console.log('[DEBUG] App bootstrapped successfully'))
  .catch((err) => console.error('[DEBUG] Bootstrap error:', err));
