import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";

/** News Popup */
export class NewsPopup extends PopupBase {
    public link = ko.observable<string>();
    public url = ko.observable<string>();
    public title = ko.observable<string>();
    public loading = ko.observable<boolean>(false);

    public setData(data: BannerData) {
        this.link(data.Link);
        this.url(data.Url);
        this.title(data.Title);
    }

    public openBanner() {
        window.open(this.link(), "_system", "location=yes");
    }
}
