import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { GridModule } from '@progress/kendo-angular-grid';
import { IntlModule } from '@progress/kendo-angular-intl';
import { BIGridComponent, BIModulesModule } from 'bi-modules';
import { DataTypes, IChangeset } from 'bi-interfaces';
import { ProductDataService } from './product-data.service';
import { productColumns } from './product-columns';
import { productChangeset } from './product-changeset';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, BIModulesModule, MatTabsModule, GridModule, IntlModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  @ViewChild('grid') grid!: BIGridComponent;

  columns = productColumns;
  changeSet: IChangeset = productChangeset;
  rowTitle = '( Order ID: null, Original Product: null )';
  selectedProduct: any = null;

  gridColumns = productColumns
    .filter((c) => c.IsVisible !== false)
    .map((c) => {
      let format: string | null = null;
      if (c.DataType === DataTypes.NUMERIC) {
        format = '{0:n0}';
      } else if (c.DataType === DataTypes.Date) {
        format = 'dd/MM/yyyy';
      }
      return { Name: c.Name, DisplayName: c.DisplayName, Width: c.Width ?? 150, Format: format };
    });

  constructor(public dataService: ProductDataService) {}

  get selectedRows(): any[] {
    return this.selectedProduct ? [this.selectedProduct] : [];
  }

  private getSelectedRow(event: any): any {
    try {
      const raw = this.grid?.GetRowValue?.();
      if (raw && typeof raw === 'object') {
        return raw;
      }
    } catch {
      // grid selection not ready yet
    }
    const row = event && event.dataItem ? event.dataItem : event;
    return row && typeof row === 'object' ? row : null;
  }

  private captureSelection(event: any): void {
    const row = this.getSelectedRow(event);
    if (row) {
      this.selectedProduct = { ...row, Date: this.toDate(row.Date) };
    }
  }

  private toDate(value: any): Date | null {
    if (value == null) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  onRowChange(event: any): void {
    this.captureSelection(event);
    if (this.selectedProduct) {
      const orderId = this.selectedProduct['OrderId'] ?? 'null';
      const product = this.selectedProduct['OriginalProduct'] ?? 'null';
      this.rowTitle = `( Order ID: ${orderId}, Original Product: ${product} )`;
    }
  }

  onLoadData(event: any): void {
    if (this.dataService.getValue().total === 0) {
      this.dataService.read('');
    } else {
      setTimeout(() => this.captureSelection(null));
    }
  }
  afterSave(event: any): void {}
  afterAdd(event: any): void {}
  onCellClick(event: any): void {
    if (event && event.dataItem) {
      this.captureSelection(event);
    }
  }
  onActionClicked(event: any): void {}
}