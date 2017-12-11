
import { getDeleteRequestInit, getPutRequestInit, getRequestInit } from "./helper";
import { debugSettings } from "../debugsettings";

interface TableReloadInformation {
    reloadRequired: boolean;

    /**
     * Gets or sets a value indicating whether table was reloaded.
     */
    tableReloaded: boolean;

    seat1Reloaded: boolean;

    seat2Reloaded: boolean;

    seat3Reloaded: boolean;

    seat4Reloaded: boolean;

    seat5Reloaded: boolean;

    seat6Reloaded: boolean;

    seat7Reloaded: boolean;

    seat8Reloaded: boolean;

    seat9Reloaded: boolean;

    seat10Reloaded: boolean;

    emergencyReload: boolean;
}

const defaultHeaders = new Headers();
defaultHeaders.append("Content-Type", "application/json");
defaultHeaders.append("pragma", "no-cache");
defaultHeaders.append("cache-control", "no-cache");
const get: RequestInit = {
    headers: defaultHeaders,
};

const put = {
    method: "PUT",
    headers: defaultHeaders,
};

const del = {
    method: "DELETE",
    headers: defaultHeaders,
};

export class TableReload {
    constructor(public host: string) {
    }

    public async getTableReload(tableId: number) {
        const event = "Get table reload";
        this.logStartReloadEvent(event);
        const response = await fetch(this.host + `/server/api/reload/${tableId}`, get);
        const jsonData = await response.json() as TableReloadInformation;
        this.log(`Finish ${event} with status ${response.status} returns data ${jsonData}`);
        return jsonData;
    }

    public async confirmEmergencyReload(tableId: number) {
        const event = "Confirm emergency reload";
        this.logStartReloadEvent(event);
        const response = await fetch(this.host + `/server/api/reload/${tableId}/table/emergency`, del);
        this.logFinishReloadEvent(event, response.status);
    }

    public async confirmTableReload(tableId: number) {
        const event = "Confirm table " + tableId + " reload";
        this.logStartReloadEvent(event);
        const response = await fetch(this.host + `/server/api/reload/${tableId}/table`, put);
        this.logFinishReloadEvent(event, response.status);

    }

    public async confirmSeatReload(tableId: number, seatId: number) {
        const event = `Confirm seat ${seatId} on table ${tableId} + reload`;
        this.logStartReloadEvent(event);
        const response = await fetch(this.host + `/server/api/reload/${tableId}/seats/${seatId}`, put);
        this.logFinishReloadEvent(event, response.status);
    }

    private logStartReloadEvent(event: string) {
        if (!debugSettings.reload.traceReload) {
            return;
        }

        this.log(`Starting ${event}`);
    }

    private logFinishReloadEvent(event: string, status: any) {
        if (!debugSettings.reload.traceReload) {
            return;
        }

        this.log(`Finish ${event} with status ${status}`);
    }

    private log(event: string) {
        console.log(event);
    }
}
