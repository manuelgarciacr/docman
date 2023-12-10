import { Component } from '@angular/core';

@Component({
    /// Router pages don't need selector, but angular 17 shows a warning. Generates
    //   duplicate internal IDs in components that appear duplicated.
    selector: "e404-component",
    standalone: true,
    templateUrl: "./e404.component.html",
    styleUrl: "./e404.component.scss",
})
export class E404Component {}
