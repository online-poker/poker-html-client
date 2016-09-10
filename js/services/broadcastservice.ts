/// <reference path="../popups/simplepopup.ts" />

import { SimplePopup } from "../popups/simplepopup";

/**
* Manages broadcast services
*/
class BroadcastService {
    /**
    * Displays broadcast messages
    * @message String Broadcast message to be displayed.
    */
    displayMessage(message: string) {
        SimplePopup.display(_("broadcast.caption"), message);
    }
}

var broadcastService = new BroadcastService();
export = broadcastService;
