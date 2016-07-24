/// <reference path="../_references.ts" />
/// <reference path="../platform.d.ts" />

class SoundManager {
    enabled = ko.observable(false);
    tableSoundsEnabled = ko.observable(false);
    playFold() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/fold.mp3");
    }
    playCheck() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/check.mp3");
    }
    playCall() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/call.mp3");
    }
    playBet() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/raise.mp3");
    }
    playRaise() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/raise.mp3");
    }
    playAllIn() {
        if (!this.enabled() || !this.tableSoundsEnabled()) {
            return;
        }

        this.quickPlay("snd/raise.mp3");
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
    private quickPlay(fileName) {
		/* tslint:disable:no-string-literal */
        if (window["Media"] != null) {
            var platformPrefix = platformInfo.mediaRoot;
            var media = new Media(platformPrefix + fileName, () => {
                console.log("Playing audio completed");
                media.release();
            }, (err) => {
                console.log("Playing audio failed. Error ", err);
                media.release();
            });
            media.play();
        }
		/* tslint:enable:no-string-literal */
    }
}

var soundManager = new SoundManager();
