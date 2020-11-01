import {Component, ViewEncapsulation} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, filter, switchMap, tap} from 'rxjs/operators';
import {EMPTY, Observable} from 'rxjs';
import {AsyncSystem} from '@activejs/core';

type SearchResults = [string, string[], string[], string[]];
interface FormattedItem {
  title: string;
  snippet: string;
  url: string;
}

@Component({
  selector: 'ajs-typeahead-example',
  templateUrl: './typeahead.component.html',
  styleUrls: ['./typeahead.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TypeaheadComponent {
  readonly searchSystem = new AsyncSystem<string, FormattedItem[], HttpErrorResponse>({
    QUERY_UNIT: {
      dispatchDebounce: true,
    },
  });

  readonly searchStream = this.searchSystem.createStream((queryUnit, dataUnit, errorUnit) =>
    queryUnit.future$.pipe(
      filter(query => {
        if (query.trim()) {
          return true;
        }
        dataUnit.clearValue();
      }),
      switchMap(query =>
        this.getWikipediaArticles(query).pipe(
          tap(data => dataUnit.dispatch(this.formatSearchResults(data))),

          catchError(err => {
            errorUnit.dispatch(err);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(private http: HttpClient) {}

  formatSearchResults([query, titles, noop, urls]: SearchResults): FormattedItem[] {
    return titles.map((title, i) => ({
      title,
      url: urls[i],
      snippet: title.replace(new RegExp(`(${query})`, 'i'), '<b>$1</b>'),
    }));
  }

  getWikipediaArticles(title: string): Observable<SearchResults> {
    const url = 'https://en.wikipedia.org/w/api.php';
    const params = {
      search: title,
      action: 'opensearch',
      format: 'json',
      origin: '*',
    };
    return this.http.get<SearchResults>(url, {params});
  }
}
