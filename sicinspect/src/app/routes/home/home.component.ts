import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { InspectService } from 'src/app/services/inspect.service';
import { switchMap, take, tap, map, catchError, shareReplay, scan } from 'rxjs/operators'
import { Subject, ReplaySubject, EMPTY, of, merge } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParsedRequest } from 'src/app/services/data-models';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private config: any;
  private _groupingKey = '';
  private _latestTimestamp = this.dateMin
  public autoRefresh = true;
  
  constructor(
    private snackBar: MatSnackBar,
    private cookieService: CookieService,
    private alertService: AlertService,
    private inspectService: InspectService,
    private configService: ConfigService
  ) { 
    this.config = configService.get('homeComponent')
  }

  ngOnInit(): void {
    this.groupingKey = this.cookieService.get('grouping_key');

    if (this.groupingKey.length < 10) {
      this.generateNewEndpoint(true);
    }
    else {
      this.triggerRequests();
    }

    setInterval(() => {
      if (this.autoRefresh) {
        this.triggerRequests();
      }
    }, this.config.refreshMilliseconds);
  }

  public triggerRequests() {
    this.triggerParsedRequests$.next({groupingKey: this.groupingKey, latestTimestamp: this.latestTimestamp});
  }

  public clearRequests() {
    this.latestTimestamp = this.dateMin;
    this.clearParsedRequests$.next(null);
  }

  public get dateMin() {
    return new Date('0001-01-01T00:00:00Z');
  }

  public get groupingKey() {
    return this._groupingKey;
  }

  private set groupingKey(value: string) {
    this._groupingKey = value;
  }

  public get latestTimestamp() {
    return this._latestTimestamp;
  }

  private set latestTimestamp(value: Date) {
    this._latestTimestamp = value;
  }

  private clearParsedRequests$ = new Subject<null>();
  private triggerParsedRequests$ = new ReplaySubject<{groupingKey: string, latestTimestamp: Date}>(1);
  public parsedRequests$ = merge(
    this.triggerParsedRequests$,
    this.clearParsedRequests$
  ).pipe(
    switchMap(x => {

      if (x==null) {
        return of(null);
      }

      return of(x).pipe(
        switchMap(x => this.inspectService.getManyParsedRequests(x.groupingKey, x.latestTimestamp).pipe(
          catchError((err, caught) => this.handleHttpError(err))
        )),
        map(x => x.requests as ParsedRequest[]),
        map(x => x.filter(r => r.creationTime > this.latestTimestamp)),
        tap(x => {
          if(x?.length ?? 0 > 0) {
            this.latestTimestamp = x.reduce((timestamp, req) => req.creationTime > timestamp ? req.creationTime : timestamp, this.dateMin);
          }
        })
      );

    }),
    scan((acc: ParsedRequest[] | null, curr: ParsedRequest[] | null) => {
      if (curr === null) {
        return [];
      }
      return [...curr, ...acc ?? []]
    }),
    shareReplay(1)
  );

  public generateNewEndpoint(bypassConfirm = false) {

    const gen = () => {
      this.inspectService.generateGroupingKey().pipe(
        catchError((err, caught) => this.handleHttpError(err)),
        map(x => x.groupingKey),
        tap(x => this.cookieService.set('grouping_key', x)),
        take(1)
      ).subscribe(groupingKey => {
        this.groupingKey = groupingKey;
        this.clearRequests();
      })
    }
    
    if (bypassConfirm) {
      gen();
      return;
    }

    this.alertService.confirm('Clear Requests?', 'List of requests will be cleared, continue?').pipe(
      take(1)
    ).subscribe(confirmation => {
      if (!confirmation) {
        return;
      }
      gen();
    });

  }
  
  public copyEndpoint() {
    this.snackBar.open('Inspect Endpoint Copied!', undefined, {
      duration: 500,
      panelClass: 'copy-snack-bar-confirmation',
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  public getInspectEndpoint(groupingKey: string) {
    return this.inspectService.getInspectEndpoint(groupingKey)
  }

  public getShareInspectionUrl(parsedRequestId: string) {
    let base = window.location.href;
    if (!base.endsWith('/')) {
      base+='/';
    }
    return `${base}inspections?parsedrequestid=${parsedRequestId}`;
  }

  public copyShareInspectionUrl() {
    this.snackBar.open('URL Copied!', undefined, {
      duration: 500,
      panelClass: 'copy-snack-bar-confirmation',
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  public requestsTrackBy(idx: number, request: ParsedRequest) {
    return request.parsedRequestId;
  }

  private handleHttpError(err: any) {
    console.log(err);
    this.alertService.alert(err.status, err.statusText);
    return EMPTY
  }
}
