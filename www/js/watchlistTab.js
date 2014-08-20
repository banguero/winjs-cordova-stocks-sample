(function () {
    "use strict";

    var util = WinJS.Utilities;
    var list = new WinJS.Binding.List();
    var isKeyboardOn = false;
    var dataResults = {};
    var initialized = false;
    var searchSuggestionList = [
        'ATVI', 'ADBE', 'AKAM', 'ALXN', 'ALTR', 'AMZN', 'AMGN', 'ADI', 'AAPL', 'AMAT',
        'ADSK', 'ADP', 'AVGO', 'BIDU', 'BBBY', 'BIIB', 'BRCM', 'CHRW', 'CA', 'CTRX',
        'CELG', 'CERN', 'CHTR', 'CHKP', 'CSCO', 'CTXS', 'CTSH', 'CMCSA', 'COST', 'DTV',
        'DISCA', 'DISCK', 'DISH', 'DLTR', 'EBAY', 'EQIX', 'EXPE', 'EXPD', 'ESRX', 'FFIV',
        'FB', 'FAST', 'FISV', 'GRMN', 'GILD', 'GOOG', 'GOOGL', 'HSIC', 'ILMN', 'INTC',
        'INTU', 'ISRG', 'GMCR', 'KLAC', 'KRFT', 'LBTYA', 'LINTA', 'LMCA', 'LMCK', 'LLTC',
        'MAR', 'MAT', 'MXIM', 'MU', 'MSFT', 'MDLZ', 'MNST', 'MYL', 'NTAP', 'NFLX',
        'NVDA', 'NXPI', 'ORLY', 'PCAR', 'PAYX', 'QCOM', 'REGN', 'ROST', 'SNDK', 'SBAC',
        'STX', 'SIAL', 'SIRI', 'SPLS', 'SBUX', 'SRCL', 'SYMC', 'TSLA', 'TXN', 'PCLN',
        'TSCO', 'TRIP', 'FOXA', 'VRSK', 'VRTX', 'VIAB', 'VIP', 'VOD', 'WDC', 'WFM',
        'WYNN', 'XLNX', 'YHOO'];

    function suggestionsRequestedHandler(ev) {
        var queryText = ev.detail.queryText,
            query = queryText.toLowerCase(),
            suggestionCollection = ev.detail.searchSuggestionCollection;
        var hasData = false;
        if (queryText.length > 0) {
            for (var i = 0, len = searchSuggestionList.length; i < len; i++) {
                if (searchSuggestionList[i].substr(0, query.length).toLowerCase() === query) {
                    if (!hasData) {
                        suggestionCollection.appendSearchSeparator("Recommendations");
                        hasData = true;
                    }
                    suggestionCollection.appendQuerySuggestion(searchSuggestionList[i]);
                }
            }
        }
    }

    function addStockHandler() {
        var addStockDialog = document.querySelector(".addStockDialog");
        addStockDialog.winControl.hide();

        Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.add, Stocks.AppBarCommands.edit]);

        var stock = Stocks.searchBox.queryText.toLowerCase();
        Stocks.Data.getStockInfo(stock).then(function (stockInfo) {
            if (stockInfo) {
                return WinJS.Promise.join({
                    stockInfo: stockInfo,
                    historyData: Stocks.Data.getStockHistory(stockInfo.symbol)
                });
            } else {
                return null;
            }
        }).then(function (item) {
            if (item) {
                var stocksList = document.querySelector(".watchlistTab .stocksList");
                if (stocksList && stocksList.winControl) {
                    stocksList.winControl.scrollPosition = 0;
                    dataResults[stock] = normalizeStockInfo(item);
                    list.splice(0, 0, dataResults[stock]);
                    persistListData();
                }
            }
        });
        Stocks.searchBox.queryText = "";
        showAppBar();
    }

    function showAppBar() {
        if (window.cordova && cordova.plugins && cordova.plugins.Keyboard) {
            // https://github.com/driftyco/ionic-plugins-keyboard.git
            cordova.plugins.Keyboard.close();
        }
        // iOS WebView workaround for AppBar with position:fixed after soft keyboard is shown
        setTimeout(function () {
            window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
            Stocks.appBar.show();
        }, 0);
    }

    function cancelAddStockHandler() {
        var addStockDialog = document.querySelector(".addStockDialog");
        addStockDialog.winControl.hide();

        Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.add, Stocks.AppBarCommands.edit]);

        Stocks.searchBox.queryText = "";

        showAppBar();
    }

    function selectionMode(on) {
        var stocksList = document.querySelector(".watchlistTab .stocksList");
        if (stocksList && stocksList.winControl) {
            var surface = stocksList.querySelector(".win-surface");
            if (on) {
                stocksList.winControl.tapBehavior = WinJS.UI.TapBehavior.toggleSelect;
                stocksList.winControl.selectionMode = "multi";
                WinJS.Utilities.addClass(surface, "win-selectionmode");

                Stocks.AppBarCommands.remove.disabled = true;
                Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.remove, Stocks.AppBarCommands.edit]);
            } else {
                stocksList.winControl.tapBehavior = WinJS.UI.TapBehavior.none;
                stocksList.winControl.selectionMode = "none";
                WinJS.Utilities.removeClass(surface, "win-selectionmode");

                Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.add, Stocks.AppBarCommands.edit]);
            }
        }
    }

    function edit() {
        var stocksList = document.querySelector(".watchlistTab .stocksList");
        var enterEditMode = stocksList && stocksList.winControl && stocksList.winControl.selectionMode === "none";
        selectionMode(enterEditMode);
    }

    function show() {
        if (!initialized) {
            initialized = true;

            var addStockDialog = document.querySelector(".addStockDialog");
            if (addStockDialog) {
                addStockDialog.addEventListener("cancelclick", cancelAddStockHandler);
                addStockDialog.addEventListener("okclick", addStockHandler);
            }

            Stocks.searchBox.addEventListener("suggestionsrequested", suggestionsRequestedHandler);
            Stocks.searchBox.addEventListener("resultsuggestionchosen", addStockHandler);
            Stocks.searchBox.addEventListener("querysubmitted", addStockHandler);

            var stocks = getUserStocks();
            var completed = 0;
            var stocksLength = stocks.length;

            var stocksInfoReceived = function () {
                completed++;
                if (stocksLength === completed) {
                    stocks.map(function (stock) {
                        // Ensure that the data is added to the binding list in the order
                        // in which the favorite stocks were saved.
                        list.push(dataResults[stock]);
                    });
                }
            }

            stocks.map(function (stock) {
                Stocks.Data.getStockInfo(stock).then(function (stockInfo) {
                    if (stockInfo) {
                        return WinJS.Promise.join({
                            stockInfo: stockInfo,
                            historyData: Stocks.Data.getStockHistory(stockInfo.symbol)
                        });
                    } else {
                        return null;
                    }
                }).then(function (item) {
                    if (item) {
                        dataResults[stock] = normalizeStockInfo(item);
                    }
                }).done(stocksInfoReceived, stocksInfoReceived);
            });
        }

        Stocks.appBar.showOnlyCommands([Stocks.AppBarCommands.add, Stocks.AppBarCommands.edit]);
        showAppBar();
        selectionMode(false);
    }

    function normalizeStockInfo(item) {
        var chartInfo = [];
        chartInfo[0] = item.historyData.stockValues;
        return {
            stockName: item.stockInfo.symbol,
            name: item.stockInfo.symbol,
            chartID: "chart" + item.stockInfo.symbol,
            percent: item.stockInfo.percent.replace(/"/g, ''),
            change: item.stockInfo.change,
            changeArrow: (item.stockInfo.change >= 0 ? Stocks.Symbols.upArrow : Stocks.Symbols.downArrow),
            lastSale: (parseFloat(item.stockInfo.lastSale) || 0).toFixed(2),
            chartInfo: chartInfo
        };
    }


    function selectionChangedHandler(ev) {
        var stocksList = document.querySelector(".stocksList").winControl;
        if (stocksList.selection.count() > 0) {
            Stocks.AppBarCommands.remove.disabled = false;
        } else {
            selectionMode(false);
        }
    }

    function deleteSelected() {
        var stocksList = document.querySelector(".watchlistTab .stocksList");
        if (stocksList) {
            var selection = stocksList.winControl.selection;
            var indices = selection.getIndices();

            for (var i = indices.length - 1; i >= 0; i--) {
                var index = indices[i];
                list.splice(index, 1);
            }

            persistListData();
            selectionMode(false);
        }
    }

    function getUserStocks() {
        var stocksData = window.localStorage["user-stocks"];
        if (stocksData === undefined) {
            var defaultStocks = ["msft", "goog", "aapl", "yhoo"];
            window.localStorage["user-stocks"] = JSON.stringify(defaultStocks);
            return defaultStocks;
        } else {
            return JSON.parse(stocksData);
        }
    }

    function persistListData() {
        var newStocks = [];
        for (var i = 0, len = list.length; i < len; i++) {
            newStocks.push(list.getAt(i).stockName.toLowerCase());
        }
        window.localStorage["user-stocks"] = JSON.stringify(newStocks);
    }

    function showAddDialog() {
        var addStockDialog = document.querySelector(".addStockDialog");
        if (addStockDialog) {
            Stocks.appBar.hide();

            addStockDialog.winControl.buttonsVisible = true;
            addStockDialog.winControl.okText = "add";
            addStockDialog.winControl.cancelText = "cancel";
            addStockDialog.winControl.fullModeRequired = false;
            addStockDialog.winControl.show();
            Stocks.searchBox.element.querySelector(".win-searchbox-input").focus();
        }
    }

    WinJS.Namespace.define("Stocks.WatchlistTab", {
        show: show,
        list: list,
        edit: util.markSupportedForProcessing(edit),
        deleteSelected: util.markSupportedForProcessing(deleteSelected),
        showAddDialog: util.markSupportedForProcessing(showAddDialog),
        selectionChangedHandler: util.markSupportedForProcessing(selectionChangedHandler)
    });
})();
