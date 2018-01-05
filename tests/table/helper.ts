import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";

export function simpleSit(view: TableView, gameType: number, money: number[]) {
    view.currentLogin("Player1");
    view.onTableStatusInfo([], [], null, 2, 10, 10, 30, 0, 1, 0, 1, true, 0, false, this, null, null, gameType);
    const data = [];
    for (let i = 1; i <= money.length; i++) {
        view.onSit(i, i, "Player" + i, money[i - 1], "url", 10, 1);
        data.push({ PlayerId: i, Money: money[i - 1] });
    }

    return data;
}

export function simpleInitialization(view: TableView, gameType: number, money: number[], dealer: number = null) {
    const data = simpleSit(view, gameType, money);

    if (dealer == null) {
        if (money.length === 2) {
            dealer = 1;
        } else {
            dealer = money.length;
        }
    }

    view.onGameStarted(1, data, [], dealer);
}

export function getTable() {
    return {
        TableId: 1,
        TableName: "Table 1",
        SmallBlind: 10,
        BigBlind: 20,
        AveragePotSize: 0,
        CurrencyId: 1,
        HandsPerHour: 1,
        IsAuthorized: true,
        JoinedPlayers: 0,
        MaxPlayers: 10,
        PotLimitType: 3,
    };
}

/**
 * Drain all pending execution tasks in the queue.
 * @param queue Queue which tasks should be drained.
 */
export async function drainQueue(queue: GameActionsQueue) {
    await queue.waitCurrentTask();
    while (queue.size() > 0) {
        await queue.execute();
        await queue.waitCurrentTask();
    }
}

export function printTableView(tableView: TableView) {
    console.log(tableView.places().filter((_) => _).map((_) => {
        return {
            PlayerId: _.PlayerId(),
            PlayerName: _.PlayerName(),
            Money: _.Money(),
            Bet: _.Bet(),
        };
    }));
}
