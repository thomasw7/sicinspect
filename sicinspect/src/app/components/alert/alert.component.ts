import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'comp-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  constructor(private alertService: AlertService) { }

  public type = '';
  public title = '';
  public message = '';

  ngOnInit(): void { 
    this.alertService.alert$.subscribe(x => {
        this.type = 'alert';
        this.title = x.title;
        this.message = x.message;
    });

    this.alertService.confirm$.subscribe(x => {
        this.type = 'confirm';
        this.title = x.title;
        this.message = x.message;
    });
  }

  public yes() {
    this.alertService.confirmResponse(true);
    this.dismiss();
  }

  public no() {
    this.alertService.confirmResponse(false);
    this.dismiss();
  }

  public dismiss() {
    this.type = '';
    this.title = '';
    this.message = '';
  }

}
