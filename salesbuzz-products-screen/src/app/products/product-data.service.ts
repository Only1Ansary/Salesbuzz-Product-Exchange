import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IDataSource, DataTypes } from 'bi-interfaces';

// ---------------------------------------------------------------------------
// Client-side OData filter support.
//
// The BI-Grid passes filter/sort/page requests to DataSource.read() as an
// OData v4 query string produced by Kendo's toODataString(), for example:
//
//   $filter=contains(originalproduct,'cap') and status eq 'pending'&$orderby=date desc&$skip=0&$top=10&$count=true
//
// Instead of forwarding those options to the server, this service loads the
// full dataset once and evaluates them client-side so the column filter menu
// (filter + sort per column) works instantly on the already-loaded rows.
// ---------------------------------------------------------------------------

type FilterNode =
  | { t: 'lit'; v: any }
  | { t: 'field'; name: string }
  | { t: 'func'; name: string; args: Array<FilterNode> }
  | { t: 'cmp'; op: string; left: FilterNode; right: FilterNode }
  | { t: 'logic'; op: 'and' | 'or'; left: FilterNode; right: FilterNode }
  | { t: 'not'; e: FilterNode };

interface QueryOptions {
  filterExpr: FilterNode | null;
  orderBy: Array<{ field: string; dir: 'asc' | 'desc' }>;
  skip: number;
  top: number;
}

interface Token {
  type: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class ProductDataService extends BehaviorSubject<any> implements IDataSource {
  // OData entity set exposed by the ProductExchangeOrdersController. Only used
  // for the initial full-data load and for add / patch / delete.
  APIURL = 'https://localhost:7241/ProductExchangeOrders';
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
  // MUST stay false: with true the BI-Grid intercepts filter changes in its own
  // (buggy) onValueChange handler and never forwards them to read(). With false
  // every filter/sort/page change is routed here, where we filter in memory.
  IsClientSideFilter = false;
  LocalData = false;
  data: any[] = [];
  total = 0;
  HasPaging = true;
  state = { skip: 0, take: 10, sort: [] as [] };
  loading = false;
  POSTAPIURL: string | undefined;
  PUTAPIURL: string | undefined;
  DELETEAPIURL: string | undefined;
  excludeDataFromReq: Array<string> = [];
  excludeTimeFromReq: Array<string> = [];
  private http = inject(HttpClient);

  private fullData: any[] = [];
  private needRefresh = true;
  private fetchInFlight: Promise<any[]> | null = null;

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
      if (key.startsWith('@odata.') || key.startsWith('odata.')) {
        return;
      }
      out[key.charAt(0).toUpperCase() + key.slice(1)] = item[key];
    });
    return out;
  }

  private extractItems(res: any): any[] {
    if (Array.isArray(res)) {
      return res;
    }
    if (res && typeof res === 'object' && Array.isArray(res.value)) {
      return res.value;
    }
    return [];
  }

  private hasToken(query: string, name: string): boolean {
    return new RegExp(`(^|&)\\$${name}=`, 'i').test(query);
  }

  // Normalizes the OData query string produced by the BI-Grid:
  //  - removes a leading '&' or '?'
  //  - removes whitespace after '=' (the grid emits "$top= 0")
  //  - de-duplicates query options, keeping the LAST occurrence
  private normalizeQuery(filter: string | undefined): string {
    let query = (filter ?? '').trim().replace(/^[?&]+/, '').replace(/=\s+/g, '=');
    if (!query) {
      return '';
    }
    const parts: string[] = [];
    query.split('&').forEach((part) => {
      const name = part.split('=')[0].trim();
      if (!name) {
        return;
      }
      const existing = parts.findIndex((p) => p.split('=')[0].trim().toLowerCase() === name.toLowerCase());
      if (existing !== -1) {
        parts.splice(existing, 1);
      }
      parts.push(part);
    });
    return parts.join('&');
  }

  // Ensures $skip/$top always exist so the in-memory paging is well-defined.
  private applyDefaults(query: string): string {
    const add: string[] = [];
    if (!this.hasToken(query, 'skip')) {
      add.push(`$skip=${this.state?.skip ?? 0}`);
    }
    if (!this.hasToken(query, 'top')) {
      add.push(`$top=${this.state?.take ?? 10}`);
    }
    return add.length ? (query ? `${query}&${add.join('&')}` : add.join('&')) : query;
  }

  private extractKeyFromFilter(url: string): string | null {
    const match = url.match(new RegExp(`${this.Key}\\s+eq\\s+(.+)`, 'i'));
    if (!match) {
      return null;
    }
    return match[1].replace(/^['"]|['"]$/g, '').trim();
  }

  // -------------------------------------------------------------------------
  // read() - client-side filter/sort/page over the full cached dataset.
  // -------------------------------------------------------------------------
  read(filter: string): void {
    this.loading = true;
    const query = this.applyDefaults(this.normalizeQuery(filter));
    const options = this.parseQuery(query);
    const isHomePage = !options.filterExpr && !options.orderBy.length && (options.skip || 0) === 0;

    const ensureData =
      this.fullData.length === 0 || (isHomePage && this.needRefresh)
        ? this.fetchAll().then((rows) => {
            this.fullData = rows;
            this.needRefresh = false;
          })
        : Promise.resolve();

    ensureData
      .then(() => {
        let rows = this.fullData;
        if (options.filterExpr) {
          rows = rows.filter((row) => !!this.evalFilter(options.filterExpr as FilterNode, row));
        }
        if (options.orderBy.length) {
          rows = this.applySort(rows, options.orderBy);
        }
        const total = rows.length;
        const page = rows.slice(options.skip, options.skip + options.top);
        this.data = page;
        this.total = total;
        this.loading = false;
        this.next({ data: page, total });
      })
      .catch(() => {
        this.data = [];
        this.total = 0;
        this.loading = false;
        this.next({ data: [], total: 0 });
      });
  }

  private fetchAll(): Promise<any[]> {
    if (!this.fetchInFlight) {
      this.fetchInFlight = firstValueFrom(
        this.http.get<any>(this.APIURL, { headers: this.authHeaders() }).pipe(
          map((res) => this.extractItems(res).map((d) => this.toPascal(d))),
          catchError(() => of([]))
        )
      ).finally(() => {
        this.fetchInFlight = null;
      });
    }
    return this.fetchInFlight;
  }

  // -------------------------------------------------------------------------
  // Parsing + evaluation of the OData v4 filter and orderby expressions.
  // -------------------------------------------------------------------------
  private parseQuery(query: string): QueryOptions {
    const params: Record<string, string> = {};
    query.split('&').forEach((part) => {
      const idx = part.indexOf('=');
      const key = (idx === -1 ? part : part.slice(0, idx)).trim();
      if (key) {
        params[key.toLowerCase()] = idx === -1 ? '' : part.slice(idx + 1);
      }
    });

    const options: QueryOptions = { filterExpr: null, orderBy: [], skip: 0, top: 0 };
    const filterText = (params['$filter'] ?? '').trim();
    if (filterText) {
      options.filterExpr = this.parseFilter(filterText);
    }
    const orderbyText = (params['$orderby'] ?? '').trim();
    if (orderbyText) {
      orderbyText.split(',').forEach((part) => {
        const bits = part.trim().split(/\s+/);
        if (bits[0]) {
          const dir = bits[1] && bits[1].toLowerCase() === 'desc' ? 'desc' : 'asc';
          options.orderBy.push({ field: bits[0].replace(/\//g, '.'), dir });
        }
      });
    }
    options.skip = Number(params['$skip']) || 0;
    options.top = Number(params['$top']) || 0;
    return options;
  }

  private tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (ch === "'") {
        let j = i + 1;
        let out = '';
        while (j < expr.length && expr[j] !== "'") {
          out += expr[j];
          j++;
        }
        tokens.push({ type: 'str', value: out });
        i = j + 1;
        continue;
      }
      if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(expr[i + 1] || ''))) {
        const m = expr.slice(i).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
        tokens.push({ type: 'num', value: m ? m[0] : ch });
        i += m ? m[0].length : 1;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i;
        let id = '';
        while (j < expr.length && /[A-Za-z0-9_$]/.test(expr[j])) {
          id += expr[j];
          j++;
        }
        const low = id.toLowerCase();
        if (['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(low)) {
          tokens.push({ type: 'op', value: low });
        } else if (low === 'and' || low === 'or') {
          tokens.push({ type: 'logic', value: low });
        } else if (low === 'not') {
          tokens.push({ type: 'not', value: low });
        } else if (low === 'true' || low === 'false' || low === 'null') {
          tokens.push({ type: 'kw', value: low });
        } else {
          tokens.push({ type: 'id', value: id });
        }
        i = j;
        continue;
      }
      if (ch === '(' || ch === ')' || ch === ',') {
        tokens.push({ type: ch, value: ch });
        i++;
        continue;
      }
      i++;
    }
    return tokens;
  }

  private parseFilter(expr: string): FilterNode | null {
    const tokens = this.tokenize(expr);
    if (!tokens.length) {
      return null;
    }
    const pos = { i: 0 };
    const node = this.parseOr(tokens, pos);
    return node;
  }

  private peek(tokens: Token[], pos: { i: number }): Token | undefined {
    return tokens[pos.i];
  }

  private parseOr(tokens: Token[], pos: { i: number }): FilterNode {
    let left = this.parseAnd(tokens, pos);
    while (this.peek(tokens, pos)?.type === 'logic' && this.peek(tokens, pos)?.value === 'or') {
      pos.i++;
      const right = this.parseAnd(tokens, pos);
      left = { t: 'logic', op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(tokens: Token[], pos: { i: number }): FilterNode {
    let left = this.parseUnary(tokens, pos);
    while (this.peek(tokens, pos)?.type === 'logic' && this.peek(tokens, pos)?.value === 'and') {
      pos.i++;
      const right = this.parseUnary(tokens, pos);
      left = { t: 'logic', op: 'and', left, right };
    }
    return left;
  }

  private parseUnary(tokens: Token[], pos: { i: number }): FilterNode {
    if (this.peek(tokens, pos)?.type === 'not') {
      pos.i++;
      return { t: 'not', e: this.parseUnary(tokens, pos) };
    }
    if (this.peek(tokens, pos)?.type === '(') {
      pos.i++;
      const node = this.parseOr(tokens, pos);
      if (this.peek(tokens, pos)?.type === ')') {
        pos.i++;
      }
      return node;
    }
    return this.parseComparison(tokens, pos);
  }

  private parseComparison(tokens: Token[], pos: { i: number }): FilterNode {
    const left = this.parseOperand(tokens, pos);
    const next = this.peek(tokens, pos);
    if (next && next.type === 'op') {
      pos.i++;
      const right = this.parseOperand(tokens, pos);
      return { t: 'cmp', op: next.value, left, right };
    }
    return left;
  }

  private parseOperand(tokens: Token[], pos: { i: number }): FilterNode {
    const tok = this.peek(tokens, pos);
    if (!tok) {
      return { t: 'lit', v: null };
    }
    if (tok.type === 'id' && tokens[pos.i + 1]?.type === '(') {
      const name = tok.value;
      pos.i += 2;
      const args: Array<FilterNode> = [];
      while (this.peek(tokens, pos) && this.peek(tokens, pos)?.type !== ')') {
        args.push(this.parseOperand(tokens, pos));
        if (this.peek(tokens, pos)?.type === ',') {
          pos.i++;
        }
      }
      if (this.peek(tokens, pos)?.type === ')') {
        pos.i++;
      }
      return { t: 'func', name, args };
    }
    if (tok.type === 'id') {
      pos.i++;
      return { t: 'field', name: tok.value };
    }
    pos.i++;
    if (tok.type === 'num') {
      return { t: 'lit', v: Number(tok.value) };
    }
    if (tok.type === 'kw') {
      if (tok.value === 'null') {
        return { t: 'lit', v: null };
      }
      return { t: 'lit', v: tok.value === 'true' };
    }
    return { t: 'lit', v: tok.value };
  }

  private getFieldValue(row: any, name: string): any {
    const compare = name.toLowerCase();
    const key = Object.keys(row || {}).find((k) => k.toLowerCase() === compare);
    return key !== undefined ? row[key] : undefined;
  }

  private evalFilter(node: FilterNode, row: any): boolean {
    return !!this.evalNode(node, row);
  }

  private evalNode(node: FilterNode, row: any): any {
    switch (node.t) {
      case 'lit':
        return node.v;
      case 'field':
        return this.getFieldValue(row, node.name);
      case 'func': {
        const name = node.name.toLowerCase();
        const args = node.args.map((a) => this.evalNode(a, row));
        const text = (v: any) => String(v ?? '').toLowerCase();
        switch (name) {
          case 'contains':
            return text(args[0]).includes(text(args[1]));
          case 'startswith':
            return text(args[0]).startsWith(text(args[1]));
          case 'endswith':
            return text(args[0]).endsWith(text(args[1]));
          case 'indexof':
            return text(args[0]).indexOf(text(args[1]));
          default:
            return false;
        }
      }
      case 'cmp': {
        const lv = this.evalNode(node.left, row);
        const rv = this.evalNode(node.right, row);
        return this.compare(lv, rv, node.op);
      }
      case 'logic': {
        const l = !!this.evalNode(node.left, row);
        const r = !!this.evalNode(node.right, row);
        return node.op === 'and' ? l && r : l || r;
      }
      case 'not':
        return !this.evalNode(node.e, row);
      default:
        return false;
    }
  }

  private compare(left: any, right: any, op: string): boolean {
    if (right === null) {
      const isNull = left === null || left === undefined;
      return op === 'eq' ? isNull : op === 'ne' ? !isNull : false;
    }
    const ln = Number(left);
    const rn = Number(right);
    const numeric =
      left !== null && left !== undefined && left !== '' && Number.isFinite(ln) && right !== null && right !== undefined && Number.isFinite(rn);
    const l = numeric ? ln : String(left ?? '').toLowerCase();
    const r = numeric ? rn : String(right ?? '').toLowerCase();
    switch (op) {
      case 'eq':
        return l === r;
      case 'ne':
        return l !== r;
      case 'gt':
        return l > r;
      case 'ge':
        return l >= r;
      case 'lt':
        return l < r;
      case 'le':
        return l <= r;
      default:
        return false;
    }
  }

  private applySort(rows: any[], orderBy: Array<{ field: string; dir: 'asc' | 'desc' }>): any[] {
    const result = rows.slice();
    for (const desc of orderBy.slice().reverse()) {
      result.sort((a, b) => {
        const av = this.getFieldValue(a, desc.field);
        const bv = this.getFieldValue(b, desc.field);
        const an = Number(av);
        const bn = Number(bv);
        let cmp: number;
        if (av !== null && av !== undefined && av !== '' && Number.isFinite(an) && bv !== null && bv !== undefined && Number.isFinite(bn)) {
          cmp = an < bn ? -1 : an > bn ? 1 : 0;
        } else {
          const as = String(av ?? '').toLowerCase();
          const bs = String(bv ?? '').toLowerCase();
          cmp = as < bs ? -1 : as > bs ? 1 : 0;
        }
        return desc.dir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // CRUD - always server-side.
  // -------------------------------------------------------------------------
  get(APIURL: string): Observable<any> {
    const keyValue = this.extractKeyFromFilter(APIURL ?? '');
    if (!keyValue) {
      return of({ value: [] });
    }
    return this.http
      .get<any>(`${this.APIURL}(${encodeURIComponent(keyValue)})`, { headers: this.authHeaders() })
      .pipe(
        map((res) => {
          const items = this.extractItems(res);
          const record = items.length ? items[0] : res && typeof res === 'object' ? res : null;
          return { value: record ? [this.toPascal(record)] : [] };
        }),
        catchError(() => of({ value: [] }))
      );
  }

  add(data: any): Observable<any> {
    this.needRefresh = true;
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

  // Builds an OData Delta (partial entity) payload. Only the exposed columns are
  // sent so the ProductExchangeOrdersController.Patch can apply them.
  patch(data: any, id: string): Observable<any> {
    this.needRefresh = true;
    const partial: Record<string, any> = {};
    this.Columns.forEach((col) => {
      if (col.Name !== this.Key && data && data[col.Name] !== undefined) {
        partial[col.Name] = data[col.Name];
      }
    });
    return this.http
      .patch<any>(`${this.APIURL}(${encodeURIComponent(id)})`, partial, { headers: this.authHeaders() })
      .pipe(map((updated) => this.toPascal(updated ?? {})));
  }

  delete(id: string): Observable<any> {
    this.needRefresh = true;
    return this.http.delete<any>(`${this.APIURL}(${encodeURIComponent(id)})`, { headers: this.authHeaders() });
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
    return filter;
  }

  formatFilter(filter: string): string {
    return '';
  }
}