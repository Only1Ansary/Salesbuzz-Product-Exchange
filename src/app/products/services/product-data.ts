import { Injectable } from '@angular/core';
import { IDataSource } from 'bi-interfaces';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { BehaviorSubject, of } from 'rxjs';
import { productColumns } from '../models/product-columns';

const MOCK_PRODUCTS = [
  { Id: 1, ProductName: 'Wireless Mouse', Price: 25.99 },
  { Id: 2, ProductName: 'Mechanical Keyboard', Price: 89.5 },
  { Id: 3, ProductName: '27" Monitor', Price: 249.0 },
  { Id: 4, ProductName: 'USB-C Hub', Price: 39.99 },
  { Id: 5, ProductName: 'Webcam HD', Price: 59.0 }
];

@Injectable({ providedIn: 'root' })
export class ProductDataService extends BehaviorSubject<GridDataResult> implements IDataSource {
  APIURL = '';
  POSTAPIURL: string | undefined;
  PUTAPIURL: string | undefined;
  DELETEAPIURL: string | undefined;
  loading = false;
  IsClientSideFilter = true;
  LocalData = true;
  /**
   * BI-Grid treats DataService as the grid observable and also reads
   * `GridData.data.data` (a GridDataResult nested under `.data`).
   */
  data: any;
  HasPaging = true;
  state = { skip: 0, take: 20, sort: [] as any };
  Columns = productColumns.map(c => ({ Name: c.Name, DataType: c.DataType as any }));
  Type =  'api' as any;
  Params: any[] = [];
  Key = 'Id'; Key2 = ''; Key3 = ''; Key4 = ''; Key5 = ''; Key6 = '';
  excludeDataFromReq: string[] = [];
  excludeTimeFromReq: string[] = [];

  constructor() {
    const result: GridDataResult = { data: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length };
    super(result);
    this.data = result;
  }

  read(_filter: string): void {
    const result: GridDataResult = { data: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length };
    this.data = result;
    this.next(result);
  }
  get(_APIURL: string) { return of([]); }
  add(data: any) { return of({ ...data, Id: MOCK_PRODUCTS.length + 1 }); }
  edit(data: any, _id: string) { return of(data); }
  patch(data: any, _id: string) { return of(data); }
  delete(_id: string) { return of({}); }
  batch(_created: any[], _updated: any[], _deleted: any[]) { return of({}); }
  formatAPIURLWithFilter(_filter: string) { return ''; }
  formatFilter(filter: string) { return filter; }
}
