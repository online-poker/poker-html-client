import { getDeleteRequestInit, getPostRequestInit, getPutRequestInit } from "./helper";

function getQueryString(params) {
    const esc = encodeURIComponent;
    return Object.keys(params)
      .map((k) => esc(k) + "=" + esc(params[k]))
      .join("&");
}

interface AddBalanceResponse extends StatusResponse {
    Amount: number;
}

export class Game {
    constructor(public host: string) {
    }

    public async getTables(fullTables: boolean | null, privateTables, maxPlayers, betLevels, moneyType, limitType, showTournamentTables: boolean) {
        const data = {
            fullTables,
            privateTables,
            maxPlayers,
            betLevels,
            moneyType,
            limitType,
            showTournamentTables,
        };
        const response = await fetch(this.host + "/api/tables?" + getQueryString(data));
        const jsonData = await response.json() as ApiResult<LobbyTableItem[]>;
        return jsonData;
    }
    public async getTableById(tableId: number) {
        const data = {};
        const response = await fetch(this.host + `/api/tables/${tableId}`);
        const jsonData = await response.json() as ApiResult<GameTableModel>;
        return jsonData;
    }
    public async getSitingTables() {
        const response = await fetch(this.host + `/api/account/my/tables`);
        const jsonData = await response.json() as ApiResult<number[]>;
        return jsonData;
    }
    public async sit(tableId: number, seat: number, amount: number, ticketCode: string) {
        const data = { Amount: amount, TicketCode: ticketCode };
        const response = await fetch(this.host + `/api/tables/${tableId}/seats/${seat}/queue`, getPostRequestInit(data));
        const jsonData = await response.json() as SitResponse;
        return jsonData;
    }
    public async sitAnywhere(tableId, amount) {
        const data = { Amount: amount };
        const response = await fetch(this.host + `/api/tables/${tableId}/seats/queue`, getPostRequestInit(data));
        const jsonData = await response.json() as SitResponse;
        return jsonData;
    }
    public async standup(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/seats/me`, getDeleteRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async fold(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/actions/fold`, getPostRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async checkOrCall(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/actions/check-call`, getPostRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async betOrRaise(tableId, amount) {
        const data = { Amount: amount };
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/actions/bet-raise`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async changeWaitQueueSettings(tableId, waitBigBlind: boolean) {
        const data = { WaitBigBlind: waitBigBlind };
        const response = await fetch(this.host + `/api/tables/${tableId}/queue/settings`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async addBalance(tableId: number, amount: number, ticketCode: string) {
        const data = { Amount: amount, TicketCode: ticketCode };
        const response = await fetch(this.host + `/api/tables/${tableId}/balance`, getPostRequestInit(data));
        const jsonData = await response.json() as AddBalanceResponse;
        return jsonData;
    }
    public async sitOut(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/status/sit-out`, getPutRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async comeBack(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/status/sit-out`, getDeleteRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async muck(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/hole-cards/both/visibility`, getDeleteRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async showCards(tableId: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/hole-cards/both/visibility`, getPutRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async showHoleCard(tableId: number, cardPosition: number) {
        const response = await fetch(this.host + `/api/tables/${tableId}/game/current/hole-cards/${cardPosition}/visibility`, getPutRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async setTableParameters(tableId: number, openCardsAutomatically: boolean) {
        const data = { OpenCardsAutomatically: openCardsAutomatically };
        const response = await fetch(this.host + `/api/tables/${tableId}/settings`, getPutRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
}
