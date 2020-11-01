import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import {Configuration} from '@activejs/core';

import {AppComponent} from './app.component';
import {HomeComponent} from './pages/home/home.component';
import {environment} from '../environments/environment';

Configuration.set({
  ENVIRONMENT: {checkSerializability: true, checkImmutability: true, checkUniqueId: true},
});

if (environment.production) {
  Configuration.enableProdMode();
}

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'playground',
    loadChildren: () =>
      import('./modules/playground/playground.module').then(m => m.PlaygroundModule),
  },
  {
    path: 'examples',
    loadChildren: () => import('./modules/examples/examples.module').then(m => m.ExamplesModule),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  declarations: [AppComponent, HomeComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes, {useHash: true})],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
