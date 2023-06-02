import { Injectable } from '@angular/core';
import { environment as config } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    constructor () { }

    public get(configuration: string): any {
      return (config as any)[configuration];
    }

    public get isProd() { return config.production === true; }
}