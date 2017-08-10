
import { getDeleteRequestInit, getPutRequestInit, getRequestInit } from "./helper";

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

const get = {
    headers: {
        "Content-Type": "application/json",
    },
};

const put = {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
    },
};

const del = {
    method: "DELETE",
    headers: {
        "Content-Type": "application/json",
    },
};

export class TableReload {
    constructor(public host: string) {
    }

    public async getTableReload(tableId: number) {
        const response = await fetch(this.host + `/server/api/reload/${tableId}`, get);
        const jsonData = await response.json() as TableReloadInformation;
        return jsonData;
    }

    public async confirmEmergencyReload(tableId: number) {
        await fetch(this.host + `/server/api/reload/${tableId}/table/emergency`, del);
    }

    public async confirmTableReload(tableId: number) {
        await fetch(this.host + `/server/api/reload/${tableId}/table`, put);
    }

    public async confirmSeatReload(tableId: number, seatId: number) {
        await fetch(this.host + `/server/api/reload/${tableId}/seats/${seatId}`, put);
    }
}
