import {} from "jasmine";
import { TestBed } from "@angular/core/testing";
import {
    HttpTestingController,
    provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
    HttpClient,
    provideHttpClient,
    withInterceptors,
} from "@angular/common/http";
import { defaultInterceptor } from "./default.interceptor";
import { UserService } from "@domain";
import { catchError, of } from "rxjs";

describe("DefaultInterceptor", () => {
    let httpTestingController: HttpTestingController;
    let httpClient: HttpClient;
    let userService: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            // here are the KEY changes
            providers: [
                provideHttpClient(withInterceptors([defaultInterceptor])),
                provideHttpClientTesting(),
                UserService,
            ],
        });
        httpTestingController = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
        userService = TestBed.inject(UserService);
    });

    afterEach(() => {
        httpTestingController.verify();
    });


    it("should add auth headers and session expired", () => {
        //arrange

        const url = "/mockendpoint";

        userService.setAccessToken("ACCESSTOKEN");
        userService.setRefreshToken("REFRESHTOKEN");

        //act

        httpClient
            .get(url)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                expect(res).toEqual({
                    status: 601,
                    message: "refresh jwt expired", // Session expired
                    data: [],
                });
            });

        const req = httpTestingController.expectOne(
            req => req.headers.get("AUthorization") == "Bearer ACCESSTOKEN"
        );
        req.flush(
            { status: 601, message: "jwt expired", data: [] },
            { status: 601, statusText: "unknown" }
        );

        const req2 = httpTestingController.expectOne(
            req => req.headers.get("AUthorization") == "Bearer REFRESHTOKEN"
        );
        req2.flush(
            { status: 601, message: "jwt expired", data: [] },
            { status: 601, statusText: "unknown" }
        );

        // assert

        expect(req.request.headers.get("Authorization")).toMatch(
            new RegExp("^Bearer ACCESSTOKEN")
        );
        expect(req2.request.headers.get("Authorization")).toMatch(
            new RegExp("^Bearer REFRESHTOKEN")
        );
    });

    it("should not add auth headers", () => {
        //arrange
        const url = "/accounts/mockendpoint";

        //act
        httpClient.get(url).subscribe();

        // assert
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get("Authorization")).not.toMatch(
            new RegExp("^Bearer ")
        );
    });

    it("should add auth headers", () => {
        //arrange
        const url = "/mockendpoint";

        //act
        httpClient.get(url).subscribe(res => {
            expect(res).toEqual({});
        });

        // assert
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get("Authorization")).toMatch(
            new RegExp("^Bearer ")
        );
        req.flush({});
    });
});
