import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { IDataSource, DataTypes } from 'bi-interfaces';

@Injectable({ providedIn: 'root' })
export class ProductDataService extends BehaviorSubject<any> implements IDataSource {
  Params: IDataSource['Params'] = [];
  Key = 'ProductID';
  Key2 = '';
  Key3 = '';
  Key4 = '';
  Key5 = '';
  Key6 = '';
  Columns: IDataSource['Columns'] = [
    { Name: 'ProductID', DataType: DataTypes.NUMERIC },
    { Name: 'ProductName', DataType: DataTypes.Text },
    { Name: 'Price', DataType: DataTypes.NUMERIC }
  ];
  Type = 'api' as IDataSource['Type'];
  IsClientSideFilter = true;
  LocalData = true;
  data: any[] = [
    { ProductID: 1, ProductName: 'Wireless Bluetooth Headphones', Price: 59.99 },
    { ProductID: 2, ProductName: 'USB-C Charging Cable', Price: 12.50 },
    { ProductID: 3, ProductName: 'Ergonomic Office Chair', Price: 299.00 },
    { ProductID: 4, ProductName: 'Mechanical Keyboard', Price: 129.95 },
    { ProductID: 5, ProductName: '27-inch 4K Monitor', Price: 449.00 },
    { ProductID: 6, ProductName: 'Wireless Mouse', Price: 24.99 },
    { ProductID: 7, ProductName: 'Laptop Stand', Price: 39.99 },
    { ProductID: 8, ProductName: 'Webcam HD 1080p', Price: 69.00 },
    { ProductID: 9, ProductName: 'Desk Lamp LED', Price: 34.50 },
    { ProductID: 10, ProductName: 'Noise Cancelling Earbuds', Price: 89.99 }
  ];
  HasPaging = true;
  state = { skip: 0, take: 10, sort: [] as [] };
  loading = false;
  APIURL = '';
  POSTAPIURL: string | undefined;
  PUTAPIURL: string | undefined;
  DELETEAPIURL: string | undefined;
  excludeDataFromReq: Array<string> = [];
  excludeTimeFromReq: Array<string> = [];

  constructor() {
    super({ data: [], total: 0 });
  }

  private emit(): void {
    this.next({ data: this.data, total: this.data.length });
  }

  edit(data: any, id: string): Observable<any> {
    const index = this.data.findIndex(d => String(d[this.Key]) === id);
    if (index > -1) {
      this.data[index] = { ...this.data[index], ...data };
    }
    this.emit();
    return of({ success: true });
  }

  patch(data: any, id: string): Observable<any> {
    return this.edit(data, id);
  }

  add(data: any): Observable<any> {
    const newId = Math.max(...this.data.map(d => d[this.Key])) + 1;
    const newItem = { ...data, [this.Key]: newId };
    this.data.push(newItem);
    this.emit();
    return of({ success: true, data: newItem });
  }

  delete(id: string): Observable<any> {
    this.data = this.data.filter(d => String(d[this.Key]) !== id);
    this.emit();
    return of({ success: true });
  }

  batch(
    CreatedItemArray: Array<any>,
    UpdatedItemArray: Array<any>,
    DeletedItemArray: Array<any>
  ): Observable<any> {
    CreatedItemArray.forEach(item => this.add(item));
    UpdatedItemArray.forEach(item => this.edit(item, String(item[this.Key])));
    DeletedItemArray.forEach(item => this.delete(String(item[this.Key])));
    return of({ success: true });
  }

  read(filter: string): void {
    setTimeout(() => this.emit(), 0);
  }

  get(APIURL: string): Observable<any> {
    return of({ data: this.data, total: this.data.length });
  }

  formatAPIURLWithFilter(filter: string): string {
    return '';
  }

  formatFilter(filter: string): string {
    return '';
  }
}
