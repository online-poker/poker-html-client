# poker-html-client [![Build Status](https://travis-ci.org/online-poker/poker-html-client.svg?branch=master)](https://travis-ci.org/online-poker/poker-html-client)

This project provide only basic library for building your own HTML clients for poker.
It is based on the existing product, and with it possible to create high-quality Cordova based 
applications and publish them to App Store/Play Market.

## How to create popup

Popups in this project is named section blocks which mapped to view model object.
That viewmodel object is regular Knockout view model. Name, or more precisely unique code, of the popup
used in the HTML to identify popup template. Below example declaration for the popup with code `custom`.

    <div class="popup custom" data-template="html/popups/custom.html"></div>

additional important part of creation new popup is registration of popup code in the application itself. For that
in the constructructor of `App` class should be added call to `App.bindPopup` function. For example: 

    this.bindPopup("custom", self.customPopup);

where `self.customPopup` is view model which will be used for controlling popup.

This piece of HTML should be present in each host application which run `poker-html-client`. Also host application should provide actual template under the path specified in the `data-template` attribute. This template loaded one time on application startup and after that retreived value of the template injected in the HTML.

After popup registration application provide following services for popup. New popup could be shown/closed and special command for quick showing of popup registed. For example:

    // Show popup using application class directly.
    app.showPopup('custom', parameters);

    // Show popup using command
    commandManager.execute('popup.custom', parameters);

    // Close current popup.
    app.closePopup();

When application requested show popup, it is show on the screen and method `shown` of the viewmodel executed. This method and ko property `visible` is required for simplest popup implementation. Generally you just have to implement popup by inheriting it from `PopupBase` class. 