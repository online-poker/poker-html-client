import * as $ from "jquery";
import * as signals from "signals";
import { App } from "../app";
import { debugSettings } from "../debugsettings";
import { PageBlock } from "../pageblock";

declare var app: App;

export class UIManager {
    public static getTabBarItemForPage(pageName: string): string {
        if (UIManager.pageMappings[pageName]) {
            return UIManager.pageMappings[pageName];
        }

        return pageName;
    }
    public static addTabBarItemMapping(tabBarItem: string, pageName: string) {
        UIManager.pageMappings[pageName] = tabBarItem;
    }

    private static pageMappings: string[] = [];

    public currentPageContainer: string;
    public effectivePageContainer: string;
    public currentPage: string;
    public currentPageBlock: string;
    public subPageHiding = new signals.Signal();
    public subPageShowing = new signals.Signal();
    public pageBlockHiding = new signals.Signal();
    public pageBlockHidden = new signals.Signal();
    public pageBlockShowing = new signals.Signal();
    public pageBlockShown = new signals.Signal();
    public popupClosed = new signals.Signal();

    constructor() {
        this.currentPageContainer = null;
        this.effectivePageContainer = null;
        this.currentPage = null;
        this.currentPageBlock = null;
    }

    public showPageBlock(pageBlockName: string) {
        if (pageBlockName === this.currentPageBlock) {
            this.pageBlockHiding.dispatch(this.currentPageBlock);
            this.pageBlockHidden.dispatch(this.currentPageBlock);
            this.pageBlockShowing.dispatch(this.currentPageBlock);
            this.pageBlockShown.dispatch(this.currentPageBlock);
            return;
        }

        const nextPageBlockObject = this.getPageBlock(pageBlockName);
        if (this.currentPageBlock !== null) {
            this.pageBlockHiding.dispatch(this.currentPageBlock);
            const currentPageBlockObject = this.getPageBlock(this.currentPageBlock);
            if (currentPageBlockObject !== null) {
                currentPageBlockObject.hideBlock();
            } else {
                $(".page .page-block." + this.currentPageBlock).css("display", "none");
            }
        }

        this.pageBlockHidden.dispatch(this.currentPageBlock);

        this.currentPage = null;
        this.currentPageBlock = pageBlockName;
        this.pageBlockShowing.dispatch(this.currentPageBlock);
        if (nextPageBlockObject !== null) {
            nextPageBlockObject.showBlock();
        } else {
            $(".page .page-block." + pageBlockName).css("display", "block");
        }

        this.pageBlockShown.dispatch(this.currentPageBlock);
    }
    public showPage(pageName: string) {
        this.logPage("Showing page '" + pageName + "'");
        if (typeof window !== "undefined") {
            if (this.currentPageContainer !== null) {
                $(".page." + this.currentPageContainer).css("display", "none");
            }
        }

        this.currentPageContainer = pageName;
        if (pageName !== "initialization") {
            this.effectivePageContainer = pageName;
        }

        if (typeof window !== "undefined") {
            $(".page." + pageName).css("display", "block");
            $(".page .sub-page.selector").css("display", "none");
        }
    }
    public showSubPage(pageName: string) {
        const nextPageObject = this.getSubPage(pageName);
        if (nextPageObject !== null) {
            if (nextPageObject.canActivate !== undefined) {
                if (!nextPageObject.canActivate()) {
                    return;
                }
            }
        }

        if (this.currentPage != null) {
            this.deactivateSubPage(this.currentPage);
        }

        this.currentPage = pageName;
        this.activateSubPage(pageName);

        if (typeof window !== "undefined") {
            $(".page .sub-page.selector").css("display", "none");
        }
    }
    public deactivateSubPage(pageName: string) {
        const pageObject = this.getSubPage(pageName);
        if (pageObject != null) {
            pageObject.deactivate();
        }

        this.subPageHiding.dispatch(pageName);
        $(".page .sub-page." + pageName).css("display", "none");
    }
    public activateSubPage(pageName: string) {
        const nextPageObject = this.getSubPage(pageName);
        if (nextPageObject != null) {
            nextPageObject.activate();
        }

        this.subPageShowing.dispatch(pageName);
        $(".page .sub-page." + pageName).css("display", "block");
    }

    /**
     * Gets page block by it's name
     * @param pageBlockName String Name of the page block to get.
     */
    public getPageBlock(pageBlockName: string) {
        if (!app.hasOwnProperty(pageBlockName + "PageBlock")) {
            return null;
        }

        return app[pageBlockName + "PageBlock"] as PageBlock;
    }

    /**
     * Gets page by it's name
     * @param subPageName String Name of the sub page to get.
     */
    public getSubPage(subPageName: string) {
        if (!app.hasOwnProperty(subPageName + "Page")) {
            return null;
        }

        return app[subPageName + "Page"] as Page;
    }

    private logPage(message: string, ...params: any[]) {
        if (debugSettings.ui.tracePages) {
            // tslint:disable-next-line:no-console
            console.log(message, params);
        }
    }
}

export const uiManager = new UIManager();
