import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { CollectionService, ICollection } from '@domain';
import { BtnComponent, CollectionsRepoService } from '@infrastructure';
import { HotToastService } from '@ngneat/hot-toast';
import { accessRepo } from '@utils';

@Component({
    selector: "app-config",
    standalone: true,
    imports: [
        NgIf,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        MatDialogClose,
        MatFormField,
        MatButtonModule,
        ReactiveFormsModule,
        MatLabel,
        MatIcon,
        MatError,
        BtnComponent,
        MatCheckbox
    ],
    templateUrl: "./config.component.html",
    styleUrl: "./config.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigComponent implements OnInit {
    private readonly collectionRepo = inject(CollectionsRepoService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly collectionService = inject(CollectionService);
    private readonly toast = inject(HotToastService);

    private readonly collection = this.collectionService.collection();

    protected readonly dialogRef = inject(MatDialogRef<ConfigComponent>);
    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );
    protected readonly loading = computed(() => this.working() != null);

    protected form: FormGroup = this.formBuilder.group({}); //new FormGroup({});

    ngOnInit(): void {
        const formGroup = {
            stayLoggedIn: new FormControl(
                this.collection?.stayLoggedIn ?? false
            ),
            twoFactor: new FormControl({ value: false, disabled: true }),
        };

        this.form = this.formBuilder.group(formGroup);
    }

    protected actualize = async () => {
        if (this.working()) return;

        const stayLoggedIn = this.getValue("stayLoggedIn");
        const twoFactor = this.getValue("twoFactor");
        const obs$ = this.collectionRepo.actualization(
            this.collection?._id ?? "",
            {
                stayLoggedIn,
                twoFactor,
                users: [],
            }
        );

        await accessRepo(`Updating`, obs$, this.working, this.toast).then(data => {
            const collection = (data as Array<ICollection>)[0];

            this.collectionService.setCollection(collection);
            this.dialogRef.close("OK")
        })
    };

    // Form Control helpers

    private getValue = (name: string) => this.form.get(name)?.value;
    // private trimValue = (name: string) => {
    //     const v = (this.getValue(name) as string).trim();
    //     this.set(name, v);
    //     return v;
    // };
    protected getCtrl = (name: string) => this.form.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.form.get(name)?.setValue(val);
}
