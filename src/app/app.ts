import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BIModulesModule } from 'bi-modules';
import { IColumns, DataTypes, ControlTypes, IChangeset } from 'bi-interfaces';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { BehaviorSubject, of } from 'rxjs';

const MOCK = [
  { Id: 1, Name: 'Item A' },
  { Id: 2, Name: 'Item B' }
];

class TestDataService extends BehaviorSubject<GridDataResult> {
  APIURL = ''; POSTAPIURL = ''; PUTAPIURL = ''; DELETEAPIURL = '';
  loading = false; IsClientSideFilter = true; LocalData = true;
  data: any; HasPaging = true; state = { skip: 0, take: 20, sort: [] as any };
  Columns = [{ Name: 'Name', DataType: DataTypes.Text }];
  Type = 'api' as any; Params: any[] = [];
  Key = 'Id'; Key2 = ''; Key3 = ''; Key4 = ''; Key5 = ''; Key6 = '';
  excludeDataFromReq: string[] = []; excludeTimeFromReq: string[] = [];
  constructor() { const r = { data: MOCK, total: MOCK.length }; super(r); this.data = r; }
  read(_f: string) { const r = { data: MOCK, total: MOCK.length }; this.data = r; this.next(r); }
  get(_u: string) { return of([]); }
  add(d: any) { return of(d); }
  edit(d: any, _id: string) { return of(d); }
  patch(d: any, _id: string) { return of(d); }
  delete(_id: string) { return of({}); }
  batch(_c: any[], _u: any[], _d: any[]) { return of({}); }
  formatAPIURLWithFilter(_f: string) { return ''; }
  formatFilter(f: string) { return f; }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BIModulesModule],
  template: `
    <BI-Grid [DataService]="dataService" [Columns]="columns" [GridName]="'TestGrid'" [DomID]="'testGridDom'" [HasPaging]="true"></BI-Grid>
  `
})
export class App {
  dataService = new TestDataService();
  columns: IColumns[] = [
    { Name: 'Name', DisplayName: 'Name', DataType: DataTypes.Text, IsEditable: true, IsFilterable: true, IsVisible: true, controlType: ControlTypes.Text, Width: 200 } as IColumns
  ];
}