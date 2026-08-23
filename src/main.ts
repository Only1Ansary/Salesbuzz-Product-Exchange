import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (!localStorage.getItem('lang')) {
  localStorage.setItem('lang', 'en');
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
