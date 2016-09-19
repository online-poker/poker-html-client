/// <reference path="../_references.ts" />

import ko = require("knockout");

const trivialViewModelFactory = function (params, componentInfo) {
    return params.data;
};

const tableIconViewModelFactory = function (params, componentInfo) {
    const tableData = <LobbyTableItem>params.data;
    return {
        displayTakenSeats: true,
        hasLoadingIndicator: false,
        MaxPlayers: tableData.MaxPlayers,
        SeatMask: tableData.SeatMask,
        loading: ko.observable(false)
    };
};

function getTemplateDefinition(name: string) {
    const useRequire = window["PokerComponents"] === undefined;
    if (useRequire) {
        return { require: "text!app/components/" + name };
    }

    return window["PokerComponents"][name];
}

export function registerComponents() {
    /**
    * Tournament lobby sub-components
    */
    ko.components.register("tournament-information", {
        template: getTemplateDefinition("lobby/tournament/information.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("tournament-tables", {
        template: getTemplateDefinition("lobby/tournament/tables.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("tournament-players", {
        template: getTemplateDefinition("lobby/tournament/players.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("tournament-prizes", {
        template: getTemplateDefinition("lobby/tournament/prizes.html"),
        viewModel: { require: "app/components/lobby/tournament/prizes" }
    });
    ko.components.register("checkbox", {
        template: getTemplateDefinition("shared/checkbox/checkbox.html"),
        viewModel: { require: "app/components/shared/checkbox/checkbox" }
    });
    ko.components.register("tournament-blinds", {
        template: getTemplateDefinition("lobby/tournament/blinds.html")
    });
    ko.components.register("rotate-phone-block", {
        template: getTemplateDefinition("rotate-phone-block/rotate-phone-block.html")
    });

    /**
    * Lobby components
    */
    ko.components.register("tables-list", {
        template: getTemplateDefinition("lobby/tables/list.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("table-list-item", {
        template: getTemplateDefinition("lobby/tables/list-item.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("table-icon", {
        template: getTemplateDefinition("lobby/tables/table-icon.html"),
        viewModel: { createViewModel: tableIconViewModelFactory }
    });
    ko.components.register("tournaments-list", {
        template: getTemplateDefinition("lobby/tournaments/list.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("tournament-list-item", {
        template: getTemplateDefinition("lobby/tournaments/list-item.html"),
        viewModel: { createViewModel: trivialViewModelFactory }
    });
    ko.components.register("cash-options", {
        template: getTemplateDefinition("lobby/filter/cash-options.html"),
        viewModel: { require: "app/components/lobby/filter/options" }
    });
    ko.components.register("tournament-options", {
        template: getTemplateDefinition("lobby/filter/tournament-options.html"),
        viewModel: { require: "app/components/lobby/filter/options" }
    });
    ko.components.register("sng-options", {
        template: getTemplateDefinition("lobby/filter/sng-options.html"),
        viewModel: { require: "app/components/lobby/filter/options" }
    });

    /**
    * Tabbar
    */
    ko.components.register("tabbar", {
        template: getTemplateDefinition("tabbar/tabbar.html"),
        viewModel: { createViewModel: tableIconViewModelFactory }
    });

    /**
    * Time block
    */
    ko.components.register("timeblock", {
        template: getTemplateDefinition("timeblock/timeblock.html"),
        viewModel: { require: "app/components/timeblock/timeblock" }
    });

    /**
    * Game type selector
    */
    ko.components.register("game-type-selector", {
        template: getTemplateDefinition("game-type-selector/game-type-selector.html"),
        viewModel: { require: "app/components/game-type-selector/gametypeselector" }
    });


    /**
    * Game table action block
    */
    ko.components.register("table-action-block", {
        template: getTemplateDefinition("table/actionBlock/actionBlock.html"),
        viewModel: { require: "app/components/table/actionBlock/actionBlock" }
    });

    ko.components.register("table-menu", {
        template: getTemplateDefinition("table/menu/menu.html"),
        viewModel: { require: "app/components/table/menu/menu" }
    });
}