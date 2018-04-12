import { ActionBlock } from "../../../table/actionBlock";

/** Action Block Component */
export class ActionBlockComponent {
    private actionBlock: ActionBlock;

    constructor(params: { data: ActionBlock }) {
        this.actionBlock = params.data;
    }
}
