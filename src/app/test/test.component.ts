import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BtnComponent } from '@infrastructure';

@Component({
    standalone: true,
    imports: [BtnComponent,
        MatButtonModule,
    MatIconModule],
    templateUrl: "./test.component.html",
    styleUrl: "./test.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent {}
