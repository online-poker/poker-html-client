declare const authToken: any;
import { l } from "../languagemanager";

/**
 * Provides integration with the website.
 */
export class WebsiteService {
    constructor(public websiteRoot: string) {
    }

    /**
     * Navigates to the forget password page
     */
    public forgetPassword() {
        this.open(this.getBase() + "reset");
    }

    /**
     * Navigates to the made deposit page
     */
    public madeDeposit() {
        this.open(this.getAuthUrl() + "area/kasa/deposit");
    }

    /**
     * Navigates to the made deposit page
     */
    public withdrawal() {
        this.open(this.getAuthUrl() + "area/kasa/pay");
    }

    /**
     * Navigates to the messages page
     */
    public messages() {
        this.open(this.getAuthUrl() + "area/message");
    }

    /**
     * Navigates to the informations page
     */
    public information() {
        this.open(this.getBase() + "info/main/");
    }

    /**
     * Navigates to the user agreement page
     */
    public userAgreement() {
        this.open(this.getBase() + "info/main/team.html");
    }

    /**
     * Navigates to the Contact Us page
     */
    public contactUs() {
        this.open(this.getBase() + "contacts");
    }

    /**
     * Navigates to the player profile
     */
    public profile() {
        this.open(this.getAuthUrl() + "area/");
    }

    /**
     * Navigates to the update APK url.
     */
    public navigateUpdateApk() {
        // this.open(this.getBase() + "update/");
    }

    private open(url: string) {
        window.open(url, "_system", "location=yes");
    }

    private getBase() {
        return this.websiteRoot + l.currentLang() + "/";
    }

    private getAuthUrl() {
        return this.websiteRoot + "redirect?auth=" + authToken + "&path=/" + l.currentLang + "/";
    }
}
