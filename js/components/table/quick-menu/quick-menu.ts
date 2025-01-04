import { Observable, observable } from "knockout";
import { TablesPage } from "../../../pages/tablespage";

export class QuickTableMenuComponent {
    private page: TablesPage;
    private visible: Observable<boolean> = observable(false);

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }

    public toggleMenu() {
        this.visible(!this.visible());
    }
}
