import { appConfig, overrideConfiguration } from "poker/appconfig";
import { ActionBlock } from "poker/table/actionBlock";

function setupTestSlider(actionBlock: ActionBlock) {
    const tableSlider = actionBlock.tableSlider;
    const x = function () {
        const lineWidth = 1000;
        const handleWidth = 100;
        const adj = -5;
        tableSlider.setBounds(adj, lineWidth - handleWidth + (-adj), (relativeX) => relativeX); // -5 is base adjustment from one size; width - 5(base adj.) - 10(?)
    };
    window.onresize = x;
    x();
    tableSlider.setParameters(0, 20, 0, 100);
}

function setupInGamePlayer(actionBlock: ActionBlock) {
    actionBlock.inGame(true);
    actionBlock.gameFinished(false);
    actionBlock.buttonsEnabled(true);
    actionBlock.turnEnabled(true);
    actionBlock.dealsAllowed(true);
    actionBlock.myPlayerInGame(true);
    actionBlock.isSitOut(false);
}

describe("Action block", function () {
    beforeAll(() => {
        global.messages = {
        };
    });
    it("Raise block visible under regular game", function () {
        const actionBlock = new ActionBlock();
        setupTestSlider(actionBlock);
        setupInGamePlayer(actionBlock);
        actionBlock.checkOrCallAmount(100);
        actionBlock.callAmount(100);
        actionBlock.playerMoney(1000);
        actionBlock.maxAmountOfMoneyForOtherActivePlayers(10000);

        expect(actionBlock.dealsAllowed()).toEqual(true);
        expect(actionBlock.gameClosed()).toEqual(false);
        expect(actionBlock.mainButtonsBlockVisible()).toEqual(true);
        expect(actionBlock.couldRaise()).toEqual(true);
        expect(actionBlock.raiseBlockVisible()).toEqual(true);
    });
    it("Raise block hidden when amount less them required for raise", function () {
        const actionBlock = new ActionBlock();
        setupTestSlider(actionBlock);
        setupInGamePlayer(actionBlock);
        actionBlock.checkOrCallAmount(100);
        actionBlock.callAmount(100);
        actionBlock.playerMoney(50);
        actionBlock.maxAmountOfMoneyForOtherActivePlayers(10000);

        expect(actionBlock.dealsAllowed()).toEqual(true);
        expect(actionBlock.gameClosed()).toEqual(false);
        expect(actionBlock.mainButtonsBlockVisible()).toEqual(true);
        expect(actionBlock.couldRaise()).toEqual(false);
        expect(actionBlock.raiseBlockVisible()).toEqual(false);
    });
    it("Raise block hidden when other players could not support raise", function () {
        const actionBlock = new ActionBlock();
        setupTestSlider(actionBlock);
        setupInGamePlayer(actionBlock);

        actionBlock.checkOrCallAmount(100);
        actionBlock.callAmount(100);
        actionBlock.playerMoney(1000);
        actionBlock.maxAmountOfMoneyForOtherActivePlayers(50);

        expect(actionBlock.dealsAllowed()).toEqual(true);
        expect(actionBlock.gameClosed()).toEqual(false);
        expect(actionBlock.mainButtonsBlockVisible()).toEqual(true);
        expect(actionBlock.couldRaise()).toEqual(false);
        expect(actionBlock.raiseBlockVisible()).toEqual(false);
    });

    describe("Raise block collapsing", function () {
        [{
            collapseRaiseBlockWhenExpanded: false, expanded: true, collapsed: false,
        }, {
            collapseRaiseBlockWhenExpanded: false, expanded: false, collapsed: false,
        }, {
            collapseRaiseBlockWhenExpanded: true, expanded: true, collapsed: true,
        }, {
            collapseRaiseBlockWhenExpanded: true, expanded: false, collapsed: false,
        }].map((definition) => {
            const expandedStatus = definition.expanded ? "expanded" : "not expanded";
            const settingStatus = definition.collapseRaiseBlockWhenExpanded ? "set" : "not set";
            it(`Does not collapse it when collapse setting is ${settingStatus} and ${expandedStatus}`, function () {
                const actionBlock = new ActionBlock();
                setupTestSlider(actionBlock);
                setupInGamePlayer(actionBlock);
                overrideConfiguration({
                    game: {
                        collapseRaiseBlockWhenExpanded: definition.collapseRaiseBlockWhenExpanded,
                    },
                });
                actionBlock.checkOrCallAmount(100);
                actionBlock.callAmount(100);
                actionBlock.playerMoney(1000);
                actionBlock.maxAmountOfMoneyForOtherActivePlayers(10000);
                actionBlock.expanded(definition.expanded);

                expect(actionBlock.raiseBlockVisible()).toEqual(true);
                expect(actionBlock.raiseBlockCollapsed()).toEqual(definition.collapsed);
            });
        });
    });
});
