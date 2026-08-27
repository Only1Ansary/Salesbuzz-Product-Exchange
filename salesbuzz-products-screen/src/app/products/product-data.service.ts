import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IDataSource, DataTypes } from 'bi-interfaces';

@Injectable({ providedIn: 'root' })
export class ProductDataService extends BehaviorSubject<any> implements IDataSource {
  APIURL = 'https://localhost:7241/api/ProductExchange';
  AUTH_URL = 'https://localhost:7241/api/auth/login';
  TOKEN_KEY = 'ProductExchange';
  USER_KEY = 'ProductExchangeUser';

  Params: IDataSource['Params'] = [];
  Key = 'OrderId';
  Key2 = '';
  Key3 = '';
  Key4 = '';
  Key5 = '';
  Key6 = '';
  Columns: IDataSource['Columns'] = [
    { Name: 'OrderId', DataType: DataTypes.NUMERIC },
    { Name: 'OriginalProduct', DataType: DataTypes.Text },
    { Name: 'OriginalQuantity', DataType: DataTypes.NUMERIC },
    { Name: 'ReplacementProduct', DataType: DataTypes.Text },
    { Name: 'ReplacementQuantity', DataType: DataTypes.NUMERIC },
    { Name: 'Reason', DataType: DataTypes.Text },
    { Name: 'Status', DataType: DataTypes.Text },
    { Name: 'Date', DataType: DataTypes.Date }
  ];
  Type = 'api' as IDataSource['Type'];
  IsClientSideFilter = true;
  LocalData = true;
  data: any[] = [];
  HasPaging = true;
  state = { skip: 0, take: 10, sort: [] as [] };
  loading = false;
  POSTAPIURL: string | undefined;
  PUTAPIURL: string | undefined;
  DELETEAPIURL: string | undefined;
  excludeDataFromReq: Array<string> = [];
  excludeTimeFromReq: Array<string> = [];
  private http = inject(HttpClient);

  constructor() {
    super({ data: [], total: 0 });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.AUTH_URL, { username, password });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  private toPascal(item: any): any {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return item;
    }
    const out: Record<string, any> = {};
    Object.keys(item).forEach((key) => {
      out[key.charAt(0).toUpperCase() + key.slice(1)] = item[key];
    });
    return out;
  }

  private fetch(): Observable<any[]> {
    return this.http.get<any[]>(this.APIURL, { headers: this.authHeaders() });
  }

  private emit(): void {
    this.next({ data: this.data, total: this.data.length });
  }

  private extractKeyFromFilter(url: string): string | null {
    const match = url.match(new RegExp(`${this.Key}\\s+eq\\s+(.+)`, 'i'));
    if (!match) {
      return null;
    }
    return match[1].replace(/^['"]|['"]$/g, '').trim();
  }

  private jsonPatchOps(data: any): any[] {
    return Object.keys(data || {})
      .filter((key) => key !== this.Key)
      .map((key) => ({
        op: 'replace',
        path: '/' + key.charAt(0).toLowerCase() + key.slice(1),
        value: data[key]
      }));
  }

  read(filter: string): void {
    this.loading = true;
    this.fetch()
      .pipe(map((result) => (Array.isArray(result) ? result : []).map((d) => this.toPascal(d))))
      .subscribe({
        next: (items) => {
          this.data = items;
          this.loading = false;
          this.emit();
        },
        error: () => {
          this.data = [];
          this.loading = false;
          this.emit();
        }
      });
  }

  get(APIURL: string): Observable<any> {
    const keyValue = this.extractKeyFromFilter(APIURL);
    return this.fetch().pipe(
      map((result) => {
        const items = (Array.isArray(result) ? result : []).map((d) => this.toPascal(d));
        const record = keyValue
          ? items.find((d) => String(d[this.Key]) === keyValue)
          : undefined;
        return record ? { value: [record] } : { value: [] };
      }),
      catchError(() => {
        const record = keyValue
          ? this.data.find((d) => String(d[this.Key]) === keyValue)
          : undefined;
        return of(record ? { value: [record] } : { value: [] });
      })
    );
  }

  add(data: any): Observable<any> {
    const { OrderId, Date: _date, ...payload } = data || {};
    const body: any = { ...payload };
    body.Status = body.Status || 'Pending';
    return this.http
      .post<any>(this.APIURL, body, { headers: this.authHeaders() })
      .pipe(map((created) => this.toPascal(created ?? {})));
  }

  edit(data: any, id: string): Observable<any> {
    return this.patch(data, id);
  }

  patch(data: any, id: string): Observable<any> {
    return this.http
      .patch<any>(`${this.APIURL}/${id}`, this.jsonPatchOps(data), { headers: this.authHeaders() })
      .pipe(map((updated) => this.toPascal(updated ?? {})));
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.APIURL}/${id}`, { headers: this.authHeaders() });
  }

  batch(
    CreatedItemArray: Array<any>,
    UpdatedItemArray: Array<any>,
    DeletedItemArray: Array<any>
  ): Observable<any> {
    const requests: Observable<any>[] = [];
    CreatedItemArray.forEach((item) => requests.push(this.add(item)));
    UpdatedItemArray.forEach((item) => requests.push(this.patch(item, String(item[this.Key]))));
    DeletedItemArray.forEach((item) => requests.push(this.delete(String(item[this.Key]))));
    return requests.length ? this.toBatchObservable(requests) : of({ success: true });
  }

  private toBatchObservable(requests: Observable<any>[]): Observable<any> {
    return new Observable<any>((subscriber) => {
      let index = 0;
      const runNext = () => {
        if (index >= requests.length) {
          subscriber.next({ success: true });
          subscriber.complete();
          return;
        }
        requests[index].subscribe({
          next: () => {
            index++;
            runNext();
          },
          error: (err) => {
            subscriber.error(err);
          }
        });
      };
      runNext();
    });
  }

  formatAPIURLWithFilter(filter: string): string {
    return '';
  }

  formatFilter(filter: string): string {
    return '';
  }
}