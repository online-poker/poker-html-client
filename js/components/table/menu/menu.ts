﻿import { TablesPage } from "../../../pages/tablespage";

export class TableMenuComponent {
    private page: TablesPage;

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }
}
