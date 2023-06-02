import { TestBed } from '@angular/core/testing';
import { CamelCaseUtility } from 'src/app/utilities/camel-case.utility';

describe('CamelCaseUtility', () => {

  [
    [
      {'snake_case': 1, 'camelCase': 2, 'PascalCase': 3},
      {'snakeCase': 1, 'camelCase': 2, 'PascalCase': 3}
    ],
    [
      'snake_case',
      'snake_case'
    ],
    [
      {'nested': [{'snake_case': 1}, {'camelCase': 2,}, {'PascalCase': 3}] },
      {'nested': [{'snakeCase': 1}, {'camelCase': 2,}, {'PascalCase': 3}] },
    ],
  ].forEach(([value, expected]) => {
    it('should convert objects properties from snake_case to camelCase', () => {
      //
      const utility = TestBed.inject(CamelCaseUtility);
    

      //
      const actual = utility.fromSnake(value);


      //
      expect(actual).toEqual(expected);
    });
  });


  it('should except when convert object properties from camelCase to snake_case', () => {
      //
      const utility = TestBed.inject(CamelCaseUtility);
    
      
      //
      const actual = () => utility.toSnake({});


      //
      expect(actual).toThrow(new Error("not implemented"));
  });

});