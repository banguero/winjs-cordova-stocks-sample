(function () {
    "use strict";

    var util = WinJS.Utilities;
    var initialized = false;

    // WinJS.UI.Listlayout is an uniform layout, so all the items need to have the same height.
    // We implement a basic custom layout here, which defaults to flow layout, therefore, news items
    // can have different heights. We don't implement virtualization support in this layout since the 
    // data source only returns 10 items.
    var NewsLayout = WinJS.Class.define(function (options) { },
        {
            // This sets up any state and CSS layout on the surface of the custom layout
            initialize: function (site) {
                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
            },
        }
    );

    function itemInvoked(e) {
        var item = Stocks.NewsTab.list.getAt(e.detail.itemIndex);
        
        // Using plugin: https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git
        window.open(item.link, "_system");
    }

    function show() {
        Stocks.appBar.hide();

        if (!initialized) {
            initialized = true;
            Stocks.Data.getNews().then(function (newsItems) {
                for (var i = 0, len = newsItems.length; i < len; i++) {
                    Stocks.NewsTab.list.push(newsItems[i]);
                }
            });
        }
    }

    WinJS.Namespace.define("Stocks.NewsTab", {
        show: show,
        itemInvoked: util.markSupportedForProcessing(itemInvoked),
        list: new WinJS.Binding.List([]),
        NewsLayout: NewsLayout
    });
})();
