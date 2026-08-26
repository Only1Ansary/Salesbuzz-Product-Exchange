import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BIModulesModule } from 'bi-modules';
import { IMenuItem } from 'bi-interfaces';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BIModulesModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('salesbuzz-products-screen');
  menuItems: IMenuItem[] = [
    { text: 'Products', icon: 'assets/icons/InventoryManagement.svg', path: '/products' }
  ];
}