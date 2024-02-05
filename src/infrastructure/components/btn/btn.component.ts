import { MatButtonModule } from '@angular/material/button';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';

@Component({
    selector: "btn-component",
    standalone: true,
    imports: [MatButtonModule],
    templateUrl: "./btn.component.html",
    styleUrl: "./btn.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BtnComponent implements AfterViewInit {
    @Output() click = new EventEmitter<MouseEvent>();
    @Input() type: string = "button";
    @Input() degree: string ="15";
    protected skew = () => `skew(-${this.degree}deg)`
    private element = inject(ElementRef);

    ngAfterViewInit(): void {
        const label = this.element.nativeElement.querySelector("span.mdc-button__label") as HTMLSpanElement;
        label.style.transform = `skew(${this.degree}deg)`
    }


    onClickButton(event: MouseEvent) {
        this.click.emit(event);
    }
}
