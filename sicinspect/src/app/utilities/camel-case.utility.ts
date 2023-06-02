import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CamelCaseUtility {
    constructor () { }

    public fromSnake(snake: any):any {
      const convert = (str: string) => str.replace(/(_\w)/g, x => x[1].toUpperCase());

      if (snake === undefined || snake === null) {
        return snake;
      }

      if (Array.isArray(snake)) {
        return snake.map(x => this.fromSnake(x));
      }

      if (typeof snake === 'object') {
        return Object.entries(snake).reduce((acc: any,[k,v]: [string, any]) => ({
          ...acc, 
          [convert(k)]: this.fromSnake(v)
        }),{})
      }

      return snake;
    }

    public toSnake(camel: any): any {
      throw new Error('not implemented');
    }
}