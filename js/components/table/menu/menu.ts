import { TablesPage } from "../../../pages/tablespage";

/** Table Menu Component */
export class TableMenuComponent {
    private page: TablesPage;

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }
}
