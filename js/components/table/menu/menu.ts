/// <reference path="../../../../Scripts/typings/knockout/knockout.d.ts" />

import ko = require("knockout");

class TableMenuComponent {
    private page: TablesPage;

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
    }
}

export = TableMenuComponent;
