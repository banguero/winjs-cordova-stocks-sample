(function () {
    "use strict";

    var util = WinJS.Utilities;
    var initialized = false;

    function itemInvoked(ev) {
        var item = Stocks.MarketsTab.list.getAt(ev.detail.itemIndex);

        // Using plugin: https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git
        window.open("http://www.bing.com/news?q=" + encodeURIComponent(item.symbol), "_system");
    }

    function show() {
        var isGrid;
        var lv = document.querySelector(".marketsList");
        if (lv && lv.winControl && lv.winControl.layout) {
            isGrid = lv.winControl.layout instanceof WinJS.UI.GridLayout;
        } else {
            isGrid = true;
        }
        Stocks.appBar.showOnlyCommands([isGrid ? Stocks.AppBarCommands.list : Stocks.AppBarCommands.grid]);
        Stocks.appBar.show();

        if (!initialized) {
            initialized = true;
            Stocks.Data.getMarkets().then(function (data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    Stocks.MarketsTab.list.push(data[i]);
                }
            });
        }
    }

    function viewAsList() {
        var lv = document.querySelector(".marketsList").winControl;
        lv.layout = new WinJS.UI.ListLayout();
        Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.grid]);
    }

    function viewAsGrid() {
        var lv = document.querySelector(".marketsList").winControl;
        lv.layout = new WinJS.UI.GridLayout();
        lv.layout.orientation = "vertical";
        Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.list]);
    }

    WinJS.Namespace.define("Stocks.MarketsTab", {
        viewAsList: util.markSupportedForProcessing(viewAsList),
        viewAsGrid: util.markSupportedForProcessing(viewAsGrid),
        itemInvoked: util.markSupportedForProcessing(itemInvoked),
        list: new WinJS.Binding.List([]),
        show: show
    });
})();
