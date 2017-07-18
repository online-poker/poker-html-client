import { TableSlider } from "../../../table/tableSlider";

export interface IRaiseBlockComponentParameters {
    data: TableSlider;
    updateTranslatorTrigger: KnockoutSubscribable<any>;
    updateTranslator: () => void;
}

export class RaiseBlockComponent {
    private tableSlider: TableSlider;

    constructor(params: IRaiseBlockComponentParameters) {
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
