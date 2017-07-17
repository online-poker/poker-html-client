/// <reference path="../poker.commanding.api.ts" />
import { appConfig } from "../appconfig";
import * as authManager from "../authmanager";

declare var baseUrl: string;

export class AppReloadService {
    public async getReload(tableId: number) {
        const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);
        return await api.getTableReload(tableId);
    }
    public startMonitoring(tableId: number) {
        setInterval(() => this.checkTableReload(tableId), 5000);
    }
    private async checkTableReload(tableId: number) {
        const reloadData = await this.getReload(tableId);
        if (reloadData.emergencyReload) {
            console.log("Emergency reload requested.");
            const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);

            // await api.confirmEmergencyReload(tableId);
            window.location.replace("http://google.com/");
            return;
        }

        if (reloadData.reloadRequired) {
            console.log("Normal reload requested.");
            if (appConfig.game.seatMode) {
                const seatId = parseInt(authManager.login().replace("Игрок", ""), 10);
                const propertyName = `seat${seatId}Reloaded`;
                if (reloadData[propertyName] === false) {
                    console.log(`Reloading seat ${seatId}.`);
                    const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);
                    await api.confirmSeatReload(tableId, seatId);
                    location.reload();
                }
            }

            if (appConfig.game.tablePreviewMode && !reloadData.tableReloaded) {
                console.log("Reloading table.");
                const api = new OnlinePoker.Commanding.API.TableReload(baseUrl);
                await api.confirmTableReload(tableId);
                location.reload();
            }
        }
    }
}
