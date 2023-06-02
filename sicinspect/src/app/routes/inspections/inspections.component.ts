import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { InspectService } from 'src/app/services/inspect.service';
import { switchMap, take, tap, map, catchError, shareReplay } from 'rxjs/operators'
import { Subject, ReplaySubject, EMPTY, of } from 'rxjs';

@Component({
  selector: 'app-inspections',
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss']
})
export class InspectionsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute ,
    private alertService: AlertService,
    private inspectService: InspectService
  ) {  }

  public queryParams$ = this.route.queryParams.pipe(
    map(x => x as any),
    shareReplay(1)
  );

  public parsedRequest$ = this.queryParams$.pipe(
    switchMap((x:any) => this.inspectService.getParsedRequest(x.parsedrequestid).pipe(
      catchError((err, caught) => this.handleHttpError(err))
    )),
  );

  ngOnInit(): void { }

  private handleHttpError(err: any) {
    console.log(err);
    this.alertService.alert(err.status, err.statusText);
    return EMPTY
  }
}
