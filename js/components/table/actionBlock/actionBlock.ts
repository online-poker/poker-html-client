/// <reference types="knockout" />

import ko = require("knockout");
import { ActionBlock } from "../../../table/actionBlock";

export class ActionBlockComponent {
    private actionBlock: ActionBlock;

    constructor(params: { data: ActionBlock }) {
        this.actionBlock = params.data;
    }
}
