/// <reference types="knockout" />

import ko = require("knockout");
import { TablesPage } from "../../../pages/TablesPage";

export class TableMenuComponent {
    private page: TablesPage;

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }
}
