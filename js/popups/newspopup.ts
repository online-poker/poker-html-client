/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

class NewsPopup extends PopupBase {
    link = ko.observable<string>();
    url = ko.observable<string>();
    title = ko.observable<string>();
    loading = ko.observable<boolean>(false);

    setData(data: BannerData) {
        this.link(data.Link);
        this.url(data.Url);
        this.title(data.Title);
    }

    openBanner() {
        window.open(this.link(), "_system", "location=yes");
    }
}
