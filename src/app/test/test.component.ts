import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BtnComponent } from '@infrastructure';

@Component({
    //selector: "app-test",
    standalone: true,
    imports: [BtnComponent,
        MatButtonModule],
    templateUrl: "./test.component.html",
    styleUrl: "./test.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent {}
