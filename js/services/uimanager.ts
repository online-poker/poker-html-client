/// <reference types="jquery" />
/// <reference path="../pageblock.ts" />

import { App } from "../app";

declare var app: App;

export class UIManager {
    currentPageContainer: string;
    effectivePageContainer: string;
    currentPage: string;
    currentPageBlock: string;
    subPageHiding = new signals.Signal();
    subPageShowing = new signals.Signal();
    pageBlockHiding = new signals.Signal();
    pageBlockHidden = new signals.Signal();
    pageBlockShowing = new signals.Signal();
    pageBlockShown = new signals.Signal();
    popupClosed = new signals.Signal();
    static pageMappings: string[] = [];

    constructor() {
        var self = this;

        this.currentPageContainer = null;
        this.effectivePageContainer = null;
        this.currentPage = null;
        this.currentPageBlock = null;
    }

    showPageBlock(pageBlockName: string) {
        if (pageBlockName === this.currentPageBlock) {
            this.pageBlockHiding.dispatch(this.currentPageBlock);
            this.pageBlockHidden.dispatch(this.currentPageBlock);
            this.pageBlockShowing.dispatch(this.currentPageBlock);
            this.pageBlockShown.dispatch(this.currentPageBlock);
            return;
        }

        var nextPageBlockObject = this.getPageBlock(pageBlockName);
        if (this.currentPageBlock !== null) {
            this.pageBlockHiding.dispatch(this.currentPageBlock);
            var currentPageBlockObject = this.getPageBlock(this.currentPageBlock);
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
    showPage(pageName: string) {
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
    showSubPage(pageName: string) {
        var nextPageObject = this.getSubPage(pageName);
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
    deactivateSubPage(pageName: string) {
        var pageObject = this.getSubPage(pageName);
        if (pageObject != null) {
            pageObject.deactivate();
        }

        this.subPageHiding.dispatch(pageName);
        $(".page .sub-page." + pageName).css("display", "none");
    }
    activateSubPage(pageName: string) {
        var nextPageObject = this.getSubPage(pageName);
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
    getPageBlock(pageBlockName: string) {
		if (!app.hasOwnProperty(pageBlockName + "PageBlock")) {
			return null;
		}

        return <PageBlock>app[pageBlockName + "PageBlock"];
    }

    /**
    * Gets page by it's name
    * @param subPageName String Name of the sub page to get.
    */
    getSubPage(subPageName: string) {
        if (!app.hasOwnProperty(subPageName + "Page")) {
			return null;
		}

        return <Page>app[subPageName + "Page"];
    }
    static getTabBarItemForPage(pageName: string): string {
        if (UIManager.pageMappings[pageName]) {
            return UIManager.pageMappings[pageName];
        }

        return pageName;
    }
    static addTabBarItemMapping(tabBarItem: string, pageName: string) {
        UIManager.pageMappings[pageName] = tabBarItem;
    }

    private logPage(message: string, ...params: any[]) {
        if (debugSettings.ui.tracePages) {
            console.log(message, params);
        }
    }
}

export var uiManager = new UIManager();
