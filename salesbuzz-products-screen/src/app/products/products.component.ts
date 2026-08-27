import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BIGridComponent, BIModulesModule } from 'bi-modules';
import { IChangeset } from 'bi-interfaces';
import { ProductDataService } from './product-data.service';
import { productColumns } from './product-columns';
import { productChangeset } from './product-changeset';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [BIModulesModule, MatTabsModule, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  @ViewChild('grid') grid!: BIGridComponent;

  columns = productColumns;
  changeSet: IChangeset = productChangeset;
  rowTitle = '( Order ID: null, Original Product: null )';

  constructor(public dataService: ProductDataService, private router: Router) {}

  get username(): string {
    return localStorage.getItem(this.dataService.USER_KEY) || 'User';
  }

  logout(): void {
    this.dataService.clearAuth();
    this.router.navigate(['/login']);
  }

  onRowChange(event: any): void {
    if (event) {
      const orderId = event['OrderId'] ?? 'null';
      const product = event['OriginalProduct'] ?? 'null';
      this.rowTitle = `( Order ID: ${orderId}, Original Product: ${product} )`;
    }
  }

  onLoadData(event: any): void {
    if (this.dataService.getValue().total === 0) {
      this.dataService.read('');
    }
  }
  afterSave(event: any): void {}
  afterAdd(event: any): void {}
  onCellClick(event: any): void {}
  onActionClicked(event: any): void {}
}