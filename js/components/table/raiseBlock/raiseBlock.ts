/// <reference types="knockout" />

import ko = require("knockout");
import { TableSlider } from "../../../table/tableSlider";

export class RaiseBlockComponent {
    private tableSlider: TableSlider;

    constructor(params: { data: TableSlider }) {
        this.tableSlider = params.data;
    }
}
