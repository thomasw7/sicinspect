import { Injectable } from '@angular/core';
import { switchMap, take, tap, map, catchError, shareReplay } from 'rxjs/operators'
import { Subject, EMPTY, of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor () { }

  private alertTrigger$ = new Subject<{ title: string, message: string }>();
  public alert$ = this.alertTrigger$.asObservable();
  
  public alert(title: string, message: string) {
    this.alertTrigger$.next({
        title: title,
        message: message
    });
  }

  private confirmTrigger$ = new Subject<{ title: string, message: string }>();
  public confirm$ = this.confirmTrigger$.asObservable();
  private confirmResponse$ = new Subject<boolean>();

  public confirm(title: string, message: string) {
    this.confirmTrigger$.next({
      title: title,
      message: message
    });

    return this.confirmResponse$.asObservable().pipe(take(1));
  }

  public confirmResponse(response: boolean) {
    this.confirmResponse$.next(response);
  }
}