(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;
    var app = WinJS.Application;
    var util = WinJS.Utilities;
    var showFunctions = [Stocks.WatchlistTab.show, Stocks.NewsTab.show, Stocks.MarketsTab.show];

    function disableEntranceAnimation(ev) {
        // Disable ListView entrance animation since the Pivot provides an animation
        ev.preventDefault();
    }

    app.addEventListener("ready", function () {
        WinJS.UI.processAll().then(function () {

            var appPivot = document.querySelector(".appPivot").winControl;
            appPivot.addEventListener("selectionchanged",  function selectionChanged(ev) {
                var index = ev.target.winControl.selectedIndex;
                if (index < showFunctions.length) {
                    showFunctions[index]();
                }
            });

            var appBar = document.querySelector(".win-appbar").winControl;
            var searchBox = document.querySelector(".symbolToAdd").winControl;

            WinJS.Namespace.define("Stocks.AppBarCommands", {
                list:  appBar.getCommandById("listCmd"),
                grid:  appBar.getCommandById("gridCmd"),
                add:  appBar.getCommandById("plusCmd"),
                remove:  appBar.getCommandById("deleteCmd"),
                edit:  appBar.getCommandById("editCmd")
            });

            WinJS.Namespace.define("Stocks", {
                disableEntranceAnimation: util.markSupportedForProcessing(disableEntranceAnimation),
                appBar: appBar,
                searchBox: searchBox
            });

            // Prefetch data from other tabs
            Stocks.Data.getNews();
            Stocks.Data.getMarkets();
        });
    });

    app.start();

    WinJS.Namespace.define("Stocks.Symbols", {
        upArrow: "\u25B2",
        downArrow: "\u25BC"
    });
})();
