import { debugSettings } from "../debugsettings";

export class ImagePreloadService {
    preload(url: string, useAbsolute = true) {
        const absoluteUrl = useAbsolute ? this.getAbsoluteUrl(url) : url;
        const result = new Promise<string>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                this.log("URL " + url + " preloaded");
                resolve(url);
            };
            image.onerror = () => {
                this.log("URL " + url + " failed to load");
                reject(url);
            };
            image.src = absoluteUrl;
        });
        return result;
    }

    /**
    * Preload resource based on the short name of the resource.
    * @param resourcePackName String Resource name to load.
    */
    preloadResource(resourcePackName: string) {
        const dpr = window.devicePixelRatio;
        if (dpr === 2) {
            return this.preload(resourcePackName + "@2x.png", false);
        }

        if (dpr === 3) {
            return this.preload(resourcePackName + "@3x.png", false);
        }

        return this.preload(resourcePackName + ".png", false);
    }

    /**
    * Preload device specific resource based on naming convention in the project.
    * @param resourcePackName String Resource name to load.
    */
    preloadDeviceSpecificResource(resourcePackName: string) {
        const dpr = window.devicePixelRatio;
        if (screen.width === 1024 || screen.height === 1024) {
            return this.preloadResource(resourcePackName + "-1024");
        }

        if (screen.width === 360 || screen.height === 360) {
            return this.preloadResource(resourcePackName + "-360");
        }

        return this.preloadResource(resourcePackName);
    }

    /**
    * Converts passed url to the absolute url.
    * @param url String URL which should be converted to absolute url.
    */
    private getAbsoluteUrl(url: string) {
        if (url.indexOf("http://") === 0
            || url.indexOf("https://") === 0) {
            return url;
        }

        const absoluteUrl = window.location.href.replace("index.html", url);
        this.log("Convert url " + url + " => " + absoluteUrl);
        return absoluteUrl;
    }
    /**
    * Trace execution messages inside this class.
    */
    private log(message: string, ...params: any[]) {
        if (debugSettings.initialization.imagePreloading) {
            console.log(message, params);
        }
    }
}
