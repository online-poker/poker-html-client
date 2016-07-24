/// <reference path="../_references.ts" />

import ko = require("knockout");

var trivialViewModelFactory = function (params, componentInfo) {
    return params.data;
};

var tableIconViewModelFactory = function (params, componentInfo) {
    var tableData = <LobbyTableItem>params.data;
    return {
        displayTakenSeats: true,
        hasLoadingIndicator: false,
        MaxPlayers: tableData.MaxPlayers,
        SeatMask: tableData.SeatMask,
        loading: ko.observable(false)
    };
};
/**
* Tournament lobby sub-components
*/
ko.components.register("tournament-information", {
    template: { require: "text!app/components/lobby/tournament/information.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("tournament-tables", {
    template: { require: "text!app/components/lobby/tournament/tables.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("tournament-players", {
    template: { require: "text!app/components/lobby/tournament/players.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("tournament-prizes", {
    template: { require: "text!app/components/lobby/tournament/prizes.html" },
    viewModel: { require: "app/components/lobby/tournament/prizes" }
});
ko.components.register("checkbox", {
    template: { require: "text!app/components/shared/checkbox/checkbox.html" },
    viewModel: { require: "app/components/shared/checkbox/checkbox" }
});
ko.components.register("tournament-blinds", {
    template: { require: "text!app/components/lobby/tournament/blinds.html" }
});
ko.components.register("rotate-phone-block", {
    template: { require: "text!app/components/rotate-phone-block/rotate-phone-block.html" }
});

/**
* Lobby components
*/
ko.components.register("tables-list", {
    template: { require: "text!app/components/lobby/tables/list.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("table-list-item", {
    template: { require: "text!app/components/lobby/tables/list-item.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("table-icon", {
    template: { require: "text!app/components/lobby/tables/table-icon.html" },
    viewModel: { createViewModel: tableIconViewModelFactory }
});
ko.components.register("tournaments-list", {
    template: { require: "text!app/components/lobby/tournaments/list.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("tournament-list-item", {
    template: { require: "text!app/components/lobby/tournaments/list-item.html" },
    viewModel: { createViewModel: trivialViewModelFactory }
});
ko.components.register("cash-options", {
    template: { require: "text!app/components/lobby/filter/cash-options.html" },
    viewModel: { require: "app/components/lobby/filter/options" }
});
ko.components.register("tournament-options", {
    template: { require: "text!app/components/lobby/filter/tournament-options.html" },
    viewModel: { require: "app/components/lobby/filter/options" }
});
ko.components.register("sng-options", {
    template: { require: "text!app/components/lobby/filter/sng-options.html" },
    viewModel: { require: "app/components/lobby/filter/options" }
});

/**
* Tabbar
*/
ko.components.register("tabbar", {
    template: { require: "text!app/components/tabbar/tabbar.html" },
    viewModel: { createViewModel: tableIconViewModelFactory }
});

/**
* Time block
*/
ko.components.register("timeblock", {
    template: { require: "text!app/components/timeblock/timeblock.html" },
    viewModel: { require: "app/components/timeblock/timeblock" }
});

/**
* Game type selector
*/
ko.components.register("game-type-selector", {
    template: { require: "text!app/components/game-type-selector/game-type-selector.html" },
    viewModel: { require: "app/components/game-type-selector/gametypeselector" }
});


/**
* Game table action block
*/
ko.components.register("table-action-block", {
    template: { require: "text!app/components/table/actionBlock/actionBlock.html" },
    viewModel: { require: "app/components/table/actionBlock/actionBlock" }
});

ko.components.register("table-menu", {
    template: { require: "text!app/components/table/menu/menu.html" },
    viewModel: { require: "app/components/table/menu/menu" }
});
