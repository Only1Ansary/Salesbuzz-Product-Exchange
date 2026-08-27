import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BIModulesModule } from 'bi-modules';
import { IMenuItem } from 'bi-interfaces';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, BIModulesModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('salesbuzz-products-screen');
  isLoginPage = false;
  menuItems: IMenuItem[] = [
    { text: 'Products', icon: 'assets/icons/InventoryManagement.svg', path: '/products' }
  ];

  constructor(private router: Router) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isLoginPage = this.router.url.startsWith('/login');
    });
  }
}