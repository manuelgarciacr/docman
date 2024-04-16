import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";

@Component({
    selector: "dlg",
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        MatDialogContent,
    ],
    templateUrl: "./dlg.component.html",
    styleUrl: "./dlg.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    //host: { class: "w-75" },
})
export class DlgComponent {
    protected readonly data: { title: string; text: string } =
        inject(MAT_DIALOG_DATA);
    protected readonly dialogRef = inject(MatDialogRef<DlgComponent>);
}
