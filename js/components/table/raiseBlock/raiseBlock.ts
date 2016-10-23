/// <reference types="knockout" />

import ko = require("knockout");
import { TableSlider } from "../../../table/tableSlider";

export class RaiseBlockComponent {
    private tableSlider: TableSlider;

    constructor(params: { data: TableSlider, updateTranslatorTrigger: KnockoutSubscribable<any>, updateTranslator: Function }) {
        this.tableSlider = params.data;
        if (params.updateTranslatorTrigger) {
            params.updateTranslatorTrigger.subscribe(function (newValue) {
                params.updateTranslator();
            });
        }

        if (params.updateTranslator) {
            params.updateTranslator();
        }
    }
}
