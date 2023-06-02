import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './routes/home/home.component';
import { InspectionsComponent } from './routes/inspections/inspections.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'inspections', component: InspectionsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
