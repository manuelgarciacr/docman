import { MatButtonModule } from '@angular/material/button';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, inject } from '@angular/core';

@Component({
    selector: "app-btn",
    standalone: true,
    imports: [MatButtonModule],
    templateUrl: "./btn.component.html",
    styleUrl: "./btn.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BtnComponent implements AfterViewInit {
    @Output() click = new EventEmitter<MouseEvent>();
    private element = inject(ElementRef);

    ngAfterViewInit(): void {
        const label = this.element.nativeElement.querySelector("span.mdc-button__label") as HTMLSpanElement;
        label.style.transform = "skew(30deg)"
    }


    onClickButton(event: MouseEvent) {
        this.click.emit(event);
    }
}
