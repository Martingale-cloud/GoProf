import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: false //maybe slower here because of not pure filter...
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], field : string, value:any): any[] {  
    if (!items) return [];        
        return items.filter(it => it[field] == value);

    }

}
