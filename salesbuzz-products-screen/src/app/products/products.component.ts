import { Component, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { BIGridComponent, BIModulesModule } from 'bi-modules';
import { IChangeset } from 'bi-interfaces';
import { ProductDataService } from './product-data.service';
import { productColumns } from './product-columns';
import { productChangeset } from './product-changeset';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [BIModulesModule, MatTabsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  @ViewChild('grid') grid!: BIGridComponent;

  dataService: ProductDataService;
  columns = productColumns;
  changeSet: IChangeset = productChangeset;
  rowTitle = '( Product Name: null, Price: null )';

  constructor() {
    this.dataService = new ProductDataService();
  }

  onRowChange(event: any): void {
    if (event) {
      const name = event['ProductName'] ?? 'null';
      const price = event['Price'] ?? 'null';
      this.rowTitle = `( Product Name: ${name}, Price: ${price} )`;
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

