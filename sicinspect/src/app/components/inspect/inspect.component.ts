import { Component, OnInit, Input } from '@angular/core';
import { InspectService } from 'src/app/services/inspect.service';
import { CurlService } from 'src/app/services/curl.service'
import { ParsedRequest } from 'src/app/services/data-models';

@Component({
  selector: 'comp-inspect',
  templateUrl: './inspect.component.html',
  styleUrls: ['./inspect.component.scss']
})
export class InspectComponent implements OnInit {
  public curl: string = '';

  constructor(
    private inspectService: InspectService,
    private curlService: CurlService
  ) { }

  ngOnInit(): void { }

  @Input('request') public request!: ParsedRequest;

  public generateCurl(request: ParsedRequest) {
    this.curl = 'Generating...';

    this.curlService.generate(request).subscribe(curl => {
      this.curl = curl;
    });
  }

  public getContentEndpoint(parsedRequestId: string, contentId: string) {
    return this.inspectService.getContentEndpoint(parsedRequestId, contentId)
  }

  public objectCount(obj: any) {
    return Object.keys(obj).length;
  }  
}
