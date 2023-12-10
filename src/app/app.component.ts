import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@infrastructure';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [CommonModule, RouterOutlet, NavbarComponent]
})
export class AppComponent {
  title = 'docman';
}
