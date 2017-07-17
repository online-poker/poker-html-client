/// <reference path="../platform.d.ts" />

import * as ko from "knockout";
import * as runtimeSettings from "../table/runtimesettings";
import { wait } from "./timedeferred";

export class SoundManager {
    enabled = ko.observable(false);
    tableSoundsEnabled = ko.observable(false);
    playFold() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/fold.mp3");
        this.quickPlay("snd/fold_human.mp3");
    }
    async playCheck() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        try {
            await this.quickPlay("snd/check_loud.mp3");
            await wait(200);
            await this.quickPlay("snd/check_loud.mp3");
            await wait(100);
            await this.quickPlay("snd/check_human.mp3");
        } catch (e) {
            console.log(e);
        }
    }
    playCall() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/call.mp3");
        this.quickPlay("snd/call_human.mp3");
    }
    playBet() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/bet.mp3");
        this.quickPlay("snd/bet_human.mp3");
    }
    playRaise() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/raise.mp3");
        this.quickPlay("snd/raise_human.mp3");
    }
    playAllIn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/allin.mp3");
        this.quickPlay("snd/allin_human.mp3");
    }
    playAllInCondition() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/allin.mp3");
    }
    playWinChips() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/winchips.mp3");
    }
    playTurnReminder() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turnreminder.mp3");
    }
    playTurnReminderForAll() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turnreminder.mp3");
    }
    playDealCards() {
        if (!this.enabled() || !this.tableSoundsEnabled() || !runtimeSettings.sounds.dealCardsEnabled) {
            return;
        }

        this.quickPlay("snd/shuffle.mp3");
    }
    playFlop() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/flip_b.mp3");
    }
    playFlopCards() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/flop.mp3");
    }
    playTurn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turn.mp3");
    }
    playRiver() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/river.mp3");
    }
    private quickPlay(fileName: string) {
        /* tslint:disable:no-string-literal */
        if (window["Media"] != null) {
            const platformPrefix = platformInfo.mediaRoot;
            const media = new Media(platformPrefix + fileName, () => {
                console.log("Playing audio completed");
                media.release();
            }, (err) => {
                console.log("Playing audio failed. Error ", err);
                media.release();
            });
            media.play();
        }

        if (window["Audio"] != null) {
            return new Promise(function (resolve, reject) {
                const audio = new Audio();
                audio.preload = "auto";
                audio.autoplay = true;
                audio.onerror = reject;
                audio.onended = resolve;
                audio.src = fileName;
            });
        }
        /* tslint:enable:no-string-literal */
    }
}
