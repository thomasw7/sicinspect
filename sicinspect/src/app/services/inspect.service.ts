import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/config.service';
import { CamelCaseUtility } from '../utilities/camel-case.utility';
import { ParsedRequest } from './data-models';

@Injectable({ providedIn: 'root' })
export class InspectService {
    private config: any;

    constructor (
        private http: HttpClient,
        private configService: ConfigService,
        private camelCase: CamelCaseUtility
    ) { 
        this.config = configService.get('inspectService')
    }

    
    public getInspectEndpoint(groupingKey: string) {
        const url = `${this.config.baseUrl.replace('{hostname}',location.hostname)}/inspect/${groupingKey}`;
        return url;
    }

    public getContentEndpoint(parsedRequestId: string, contentId: string) {
        const url = `${this.config.baseUrl.replace('{hostname}',location.hostname)}/requests/${parsedRequestId}/contents/${contentId}`;
        return url;
    }

    public generateGroupingKey() {
        const url = `${this.config.baseUrl.replace('{hostname}',location.hostname)}/grouping_key`;
        return this.http.post(url, {}).pipe(map(x => this.camelCase.fromSnake(x))) as Observable<any>;
    }

    public getManyParsedRequests(groupingKey: string, creationTimeStart: Date | null = null, creationTimeEnd: Date | null = null) {
        const url = `${this.config.baseUrl.replace('{hostname}',location.hostname)}/requests`;
        return this.http.get(url, { params: {
            grouping_key: groupingKey,
            creation_time_start: creationTimeStart?.toISOString() ?? '',
            creation_time_end: creationTimeEnd?.toISOString() ?? ''
        }}).pipe(
            map(x => this.camelCase.fromSnake(x) as { requests: ParsedRequest[] }),
            map(x => {
                for (const i in x.requests) {
                    x.requests[i].creationTime = new Date(x.requests[i].creationTime);
                }
                return x;
            })
        ) as Observable<{requests: ParsedRequest[]}>;
    }

    public getParsedRequest(parsedRequestId: string) {
        const url = `${this.config.baseUrl.replace('{hostname}',location.hostname)}/requests/${parsedRequestId}`;
        return this.http.get(url).pipe(map(x => this.camelCase.fromSnake(x))) as Observable<ParsedRequest>;
    }

    public getContent(parsedRequestId: string, contentId: string) {
        const url = this.getContentEndpoint(parsedRequestId, contentId);
        return this.http.get(url, { responseType: 'blob' } );
    }
}