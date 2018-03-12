import * as $ from "jquery";
import * as ko from "knockout";
import { Signal } from "signals";

export class PageBlock {
    public static useDoubleView: boolean = false;
    public shown: Signal;
    public loadPromises: JQueryPromise<void>[];
    public defaultSecondaryName: string;
    public currentPage: string;
    public currentSecondary: string;
    public secondaryViews: string[];
    public requireAuthentication: boolean = false;
    public requireGuestAuthentication: boolean = false;

    constructor(public name: string, public primaryName: string, primaryModel: any) {
        this.loadPromises = [];
        this.secondaryViews = [];
        this.bindSubPage(primaryName, primaryModel);
    }
    public addSecondary(name: string, viewModel: any, isDefault: boolean = false): void {
        if (isDefault) {
            this.defaultSecondaryName = name;
        }

        this.secondaryViews.push(name);
        this.bindSubPage(name, viewModel);
    }
    public showBlock() {
        if (typeof window !== "undefined") {
            $(this.getSelector()).show();
        }

        this.showPrimary();
        if (PageBlock.useDoubleView) {
            this.showSecondary(this.defaultSecondaryName);
        }
    }
    public hideBlock() {
        if (typeof window !== "undefined") {
            $(this.getSelector()).hide();
        }
    }
    public showPrimary() {
        this.showSubPage(this.primaryName);
    }
    public showSecondary(name: string) {
        this.showSubPage(name);
    }

    private isSecondary(pageName: string) {
        return this.secondaryViews.indexOf(pageName) !== -1;
    }
    private isPrimary(pageName: string) {
        return pageName === this.primaryName;
    }
    private isSameBlock(pageName: string) {
        return this.isPrimary(pageName) && this.isSecondary(pageName);
    }

    /**
     * Gets page by it's name
     * @param subPageName String Name of the sub page to get.
     */
    private getSubPage(subPageName: string) {
        if (!this.hasOwnProperty(subPageName + "Page")) {
            return null;
        }

        return this[subPageName + "Page"] as Page;
    }
    private showSubPage(pageName: string) {
        const nextPageObject = this.getSubPage(pageName);
        if (nextPageObject !== null) {
            if (nextPageObject.canActivate !== undefined) {
                if (!nextPageObject.canActivate()) {
                    return;
                }
            }
        }

        let needHidePrevView = this.currentPage != null;
        if (PageBlock.useDoubleView) {
            // Add additional logic when previous view should be hidden.

            // Never hide primary view.
            needHidePrevView = needHidePrevView && !this.isPrimary(this.currentPage);
        }

        if (needHidePrevView) {
            const pageObject = this.getSubPage(this.currentPage);
            if (pageObject !== null) {
                pageObject.deactivate(this.currentPage);
            }

            if (typeof window !== "undefined") {
                $(this.getPageSelector(this.currentPage)).css("display", "none");
            }
        }

        this.currentPage = pageName;
        if (nextPageObject !== null) {
            nextPageObject.activate(this.currentPage);
        }

        if (typeof window !== "undefined") {
            $(this.getPageSelector(pageName)).css("display", "block");
        }
    }
    private getSelector(): string {
        return ".page-block." + this.name;
    }
    private getPageSelector(pageName: string): string {
        return this.getSelector() + " .sub-page." + pageName;
    }
    private bindSubPage(pageName: string, viewModel: any): void {
        this[pageName + "Page"] = viewModel;
        if (typeof window === "undefined") {
            return;
        }

        const pagejElement = $(this.getPageSelector(pageName));
        if (pagejElement.length === 0) {
            // tslint:disable-next-line:no-console
            console.error("Could not bind sub page " + pageName + " since DOM element not found.");
            return;
        }

        if (pagejElement.length > 1) {
            // tslint:disable-next-line:no-console
            console.warn("Page " + pageName + " has more then one element to bind.");
            return;
        }

        const pageElement = pagejElement[0];
        if (!pageElement.hasChildNodes()) {
            const templateSource: string = pagejElement.data("template") as any;
            const pageLoadPromise = $.get(templateSource, "text/html").then(function (data: string) {
                pagejElement.html(data);
                try {
                    ko.applyBindings(viewModel, pageElement);
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.log("Bind page " + pageName + " failed");
                }
            });
            this.loadPromises.push(pageLoadPromise);
            return;
        }

        ko.applyBindings(viewModel, pageElement);
    }
}
