/// <reference path="../../../../Scripts/typings/knockout/knockout.d.ts" />

import ko = require("knockout");

class ActionBlockComponent {
    private actionBlock: ActionBlock

    constructor(params: { data: ActionBlock }) {
        this.actionBlock = params.data;
    }
}

export = ActionBlockComponent;
