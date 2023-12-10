// import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BtnComponent } from '@infrastructure';

@Component({
    // selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BtnComponent,
        MatButtonModule
    ]
})
export class LoginComponent { }
