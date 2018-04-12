﻿import * as ko from "knockout";
import * as runtimeSettings from "../table/runtimesettings";
import { wait } from "./timedeferred";

/** Manager that playes app sounds depending
 * on current configurations
 */
export class SoundManager {
    public enabled = ko.observable(false);
    public tableSoundsEnabled = ko.observable(false);

    /**
     * Initialize a new instance of the @see SoundManager class
     * @param variant Variant of the sound set.
     * @param variantHasHumanVoice Whether play human voices, or not.
     */
    constructor (public variant: string, private variantHasHumanVoice: boolean) {
    }
    public playFold() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/fold.mp3`);
        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/fold_human.mp3`);
        }
    }

    public async playCheck() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        try {
            await this.quickPlay(`snd/${this.variant}/check_loud.mp3`);
            await wait(200);
            await this.quickPlay(`snd/${this.variant}/check_loud.mp3`);
            await wait(100);
            if (this.hasHumanVoice()) {
                await this.quickPlay(`snd/${this.variant}/check_human.mp3`);
            }
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.log(e);
        }
    }
    public playCall() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/call.mp3`);
        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/call_human.mp3`);
        }
    }
    public playBet() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/bet.mp3`);
        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/bet_human.mp3`);
        }
    }
    public playRaise() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/raise.mp3`);
        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/raise_human.mp3`);
        }
    }
    public playAllIn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/allin.mp3`);
        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/allin_human.mp3`);
        }
    }
    public playAllInCondition() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/allin.mp3`);
    }
    public playWinChips() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/winchips.mp3`);
    }
    public playTurnReminder() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/turnreminder_human.mp3`);
        } else {
            this.quickPlay(`snd/${this.variant}/turnreminder.mp3`);
        }
    }
    public playTurnReminderForAll() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/turnreminder_human.mp3`);
        } else {
            this.quickPlay(`snd/${this.variant}/turnreminder.mp3`);
        }
    }
    public playDealCards() {
        if (!this.enabled() || !this.tableSoundsEnabled() || !runtimeSettings.sounds.dealCardsEnabled) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/shuffle.mp3`);
    }
    public playFlop() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay(`snd/${this.variant}/flip_b.mp3`);
    }
    public playFlopCards() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/flop.mp3`);
        } else {
            this.quickPlay(`snd/${this.variant}/flip_b.mp3`);
        }
    }
    public playTurn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/turn.mp3`);
        } else {
            this.quickPlay(`snd/${this.variant}/flip_b.mp3`);
        }
    }
    public playRiver() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        if (this.hasHumanVoice()) {
            this.quickPlay(`snd/${this.variant}/river.mp3`);
        } else {
            this.quickPlay(`snd/${this.variant}/flip_b.mp3`);
        }
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
    private hasHumanVoice(): boolean {
        return this.variantHasHumanVoice;
    }
}
