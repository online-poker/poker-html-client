import * as ko from "knockout";
import * as runtimeSettings from "../table/runtimesettings";
import { wait } from "./timedeferred";

export class SoundManager {
    public enabled = ko.observable(false);
    public tableSoundsEnabled = ko.observable(false);

    public playFold() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/fold.mp3");
        this.quickPlay("snd/fold_human.mp3");
    }

    public async playCheck() {
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
            // tslint:disable-next-line:no-console
            console.log(e);
        }
    }
    public playCall() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/call.mp3");
        this.quickPlay("snd/call_human.mp3");
    }
    public playBet() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/bet.mp3");
        this.quickPlay("snd/bet_human.mp3");
    }
    public playRaise() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/raise.mp3");
        this.quickPlay("snd/raise_human.mp3");
    }
    public playAllIn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/allin.mp3");
        this.quickPlay("snd/allin_human.mp3");
    }
    public playAllInCondition() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/allin.mp3");
    }
    public playWinChips() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/winchips.mp3");
    }
    public playTurnReminder() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turnreminder.mp3");
    }
    public playTurnReminderForAll() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turnreminder.mp3");
    }
    public playDealCards() {
        if (!this.enabled() || !this.tableSoundsEnabled() || !runtimeSettings.sounds.dealCardsEnabled) {
            return;
        }

        this.quickPlay("snd/shuffle.mp3");
    }
    public playFlop() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/flip_b.mp3");
    }
    public playFlopCards() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/flop.mp3");
    }
    public playTurn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/turn.mp3");
    }
    public playRiver() {
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
            return new Promise(function(resolve, reject) {
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
