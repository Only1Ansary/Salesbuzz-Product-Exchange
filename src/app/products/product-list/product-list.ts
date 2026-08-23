import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BIModulesModule } from 'bi-modules';
import { IChangeset } from 'bi-interfaces';
import { productColumns } from '../models/product-columns';
import { ProductDataService } from '../services/product-data';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, BIModulesModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent {
  productColumns = productColumns;
  changeSet: IChangeset = { changesetArr: [] };

  constructor(public productDataService: ProductDataService) {}

  onGridLoaded(e: any) { console.log('Grid data loaded', e); }
  onSaved(e: any) { console.log('Row saved', e); }
  onAdded(e: any) { console.log('Row added', e); }
  onCellClick(e: any) { console.log('Cell clicked', e); }
}
