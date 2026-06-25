import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './core/layout/navbar/navbar.component';
import { ToasterComponent } from './core/components/toaster/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NavbarComponent, ToasterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'survey-dashboard';
}
