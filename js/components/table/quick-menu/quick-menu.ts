import { Observable, observable } from "knockout";
import { TablesPage } from "../../../pages/tablespage";
import { App } from "poker/app";

declare const app: App;

export class QuickTableMenuComponent {
    private page: TablesPage;
    private visible: Observable<boolean> = observable(false);

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }

    public toggleMenu() {
        this.visible(!this.visible());
        if (this.visible()) {
            app.showPopup("tableMenu");
        } else {
            if (app.currentPopup === "tableMenu") {
                app.closePopup();
            }
        }
    }
}
