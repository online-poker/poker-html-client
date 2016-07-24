/// <reference path="../languageManager.ts" />

declare var authToken: any;

/** 
* Provides integration with the website.
*/
class WebsiteService {
    websiteRoot = "http://www.yourpoker.com/";

    /**
    * Navigates to the forget password page
    */
    forgetPassword() {
        this.open(this.getBase() + "reset");
    }

    /**
    * Navigates to the made deposit page
    */
    madeDeposit() {
        this.open(this.getAuthUrl() + "area/kasa/deposit");
    }

    /**
    * Navigates to the made deposit page
    */
    withdrawal() {
        this.open(this.getAuthUrl() + "area/kasa/pay");
    }

    /**
    * Navigates to the messages page
    */
    messages() {
        this.open(this.getAuthUrl() + "area/message");
    }

    /**
    * Navigates to the informations page
    */
    information() {
        this.open(this.getBase() + "info/main/");
    }

    /**
    * Navigates to the user agreement page
    */
    userAgreement() {
        this.open(this.getBase() + "info/main/team.html");
    }

    /**
    * Navigates to the Contact Us page
    */
    contactUs() {
        this.open(this.getBase() + "contacts");
    }

    /**
    * Navigates to the player profile
    */
    profile() {
        this.open(this.getAuthUrl() + "area/");
    }

    /**
    * Navigates to the update APK url.
    */
    navigateUpdateApk() {
        this.open(this.getBase() + "update/");
    }

    private open(url: string) {
        window.open(url, "_system", "location=yes");
    }

    private getBase() {
        return this.websiteRoot + l.currentLang + "/";
    }

    private getAuthUrl() {
        return this.websiteRoot + "redirect?auth=" + authToken + "&path=/" + l.currentLang + "/";
    }
}

var websiteService = new WebsiteService();
