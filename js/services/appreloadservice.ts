/// <reference path="../poker.commanding.api.ts" />
import { debugSettings } from "../debugsettings";

declare var baseUrl: string;

export class AppReloadService {
    async getReload(tableId: number) {
        const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);
        return await api.getTableReload(tableId);
    }
    startMonitoring(tableId: number) {
        setInterval(() => this.checkTableReload(tableId), 5000);
    }
    private async checkTableReload(tableId: number) {
        const reloadData = await this.getReload(tableId);
        if (reloadData.emergencyReload) {
            const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);
            await api.confirmEmergencyReload(tableId);
            window.location.replace("http://google.com/");
        }
    }
}
