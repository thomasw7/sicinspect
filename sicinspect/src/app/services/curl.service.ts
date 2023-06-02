import { Injectable } from '@angular/core';
import { ParsedRequest, ParsedRequestParameter, ParsedRequestPart } from './data-models';
import { switchMap, take, tap, map, catchError, shareReplay, mergeMap, toArray } from 'rxjs/operators'
import { Subject, EMPTY, of, concat } from 'rxjs';
import { InspectService } from './inspect.service';

@Injectable({ providedIn: 'root' })
export class CurlService {
    constructor (private inspectService: InspectService) { }

    private getContentType(headers: ParsedRequestParameter[]) {
      const filtered = headers.filter(x => x.name.toLowerCase()==='content-type');
      const formNotFound = 'text/plain';

      if (filtered.length < 1) {
        return formNotFound;
      }

      return filtered[0].value;
    }

    private getFormName(headers: ParsedRequestParameter[]) {
      const filtered = headers.filter(x => x.name.toLowerCase()==='content-disposition');
      const formNotFound = '';

      if (filtered.length < 1) {
        return formNotFound;
      }

      const rx = /form-data; name="([^"]*)"/;
      const matched = filtered[0].value.match(rx);

      if (matched === null || matched.length < 2) {
        return formNotFound;
      }

      return matched[1];
    }

    private getFileName(headers: ParsedRequestParameter[]) {
      const filtered = headers.filter(x => x.name.toLowerCase()==='content-disposition');
      const fileNameNotFound = 'file.name';

      if (filtered.length < 1) {
        return fileNameNotFound;
      }

      const rx = /filename="([^"]*)"/;
      const matched = filtered[0].value.match(rx);

      if (matched === null || matched.length < 2) {
        return fileNameNotFound;
      }

      return matched[1];
    }

    private getForm(parsedRequestId: string, part: ParsedRequestPart) {
      const formName = this.getFormName(part.headers);
      const contentType = this.getContentType(part.headers);

      if (contentType.startsWith('text/') || contentType === 'application/json') {
        return this.inspectService.getContent(parsedRequestId, part.contentId).pipe(
          mergeMap(x => x.text()),
          //map(x => `--form '${formName}="${x.replaceAll("'","'\\''").replaceAll('"','\\"')}";type=${contentType}'`)
          map(x => `--form '${formName}="${x.replaceAll("'","'\\''").replaceAll('"','\\"')}"'`)
        );
      }

      //return of(`--form '${formName}=@"/path/to/${this.getFileName(part.headers)}";type=${contentType}'`);
      return of(`--form '${formName}=@"/path/to/${this.getFileName(part.headers)}"'`);
    }

    public generate(request: ParsedRequest) {
      const query$ = request.query.map(x => of(`${x.name}=${x.value}`));
      const queryConcatenated$ = concat(query$).pipe(
        mergeMap(x => x),
        toArray(),
        map(x => 
          `'${this.inspectService.getInspectEndpoint(request.groupingKey)}${request.path}`
            + (x.length>0 ? `?${x.join('&')}'` : `'`)
        )
      )

      const headersToFilterOut = ['content-type','content-length']
      const headers$ = request.headers.filter(x => !headersToFilterOut.includes(x.name.toLowerCase())).map(x => of(`--header '${x.name.replaceAll("'","'\\''")}: ${x.value.replaceAll("'","'\\''")}'`));
      const headersConcatenated$ = concat(headers$).pipe(
        mergeMap(x => x),
        toArray(),
        map(x => x.length>0 ? ` \\\n${x.join(' \\\n')}` : '')
      )

      const datas$ = request.isMulti 
        ? request.parts.map(x => this.getForm(request.parsedRequestId, x))
        : [];
      const datasConcatenated$ = concat(datas$).pipe(
        mergeMap(x => x),
        toArray(),
        map(x => x.length>0 ? ` \\\n${x.join(' \\\n')}` : '')
      )

      return concat([
        of(`curl --location `),
        queryConcatenated$,
        headersConcatenated$,
        datasConcatenated$
      ]).pipe(
        mergeMap(x => x),
        toArray(),
        map(x=> x.join(''))
      );
    }
}