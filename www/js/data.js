(function () {
    "use strict";

    function getStockInfo(stock) {
        var threeHours = 10800;
        var cache = getCacheData("stock-info-" + stock.toLowerCase(), threeHours);
        if (cache) {
            return WinJS.Promise.wrap(cache);
        }

        var url = "https://winjs-stocks.azure-mobile.net/api/getquotes?s=" + stock.toLowerCase();

        return WinJS.xhr({ url: url }).then(function (response) {
            response = response.responseText;
            var results = response.split("\r\n").map(function (line) {
                var parts = line.split(",");
                if (parts.length > 1) {
                    var symbol = JSON.parse(parts[0]),
                        latest = parts[1],
                        open = parts[2],
                        close = parts[3],
                        change = parts[4],
                        yearLow = parts[5],
                        yearHigh = parts[6],
                        dayLow = parts[7],
                        dayHigh = parts[8],
                        volume = parts[9],
                        marketCap = parts[10],
                        changePercent = parts[11],
                        name = parts[12];

                    if (name[name.length - 1] !== "\"") {
                        name = name + "\"";
                    }
                    name = JSON.parse(name);

                    return {
                        name: name,
                        open: open,
                        close: close,
                        marketcap: marketCap,
                        fiftyTwoWeekRange: yearLow + " - " + yearHigh,
                        lastSale: latest,
                        lastSaleTime: new Date().toString(),
                        change: change,
                        percent: changePercent,
                        volume: volume,
                        low: dayLow,
                        high: dayHigh,
                        daysRange: open === 0 ? "N/A" : (dayLow + " - " + dayHigh),
                        symbol: symbol
                    };
                }
            }).filter(function (result) { return !!result; });
            
            var info = null;
            if (results.length > 0) {
                if (results[0].change !== "N/A") {
                    info = results[0];
                    cacheData("stock-info-" + stock.toLowerCase(), info);
                }
            }
            return info;
        });
    }

    function getStockHistory(stock) {
        var cache = getCacheData("stock-history-" + stock.toLowerCase());
        if (cache) {
            return WinJS.Promise.wrap(cache);
        }

        var startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        var endDate = new Date();

        var url = "https://winjs-stocks.azure-mobile.net/api/gethistory?s=" + encodeURI(stock);

        return WinJS.xhr({ url: url }).then(function (response) {
            var firstDate = "",
            rows = response.responseText.split("\n"),
            firstValues = rows[rows.length - 2].split(","),
            firstClose = parseFloat(firstValues[4]),
            stockValues = [];

            for (var i = 1, len = rows.length - 1; i < len; i++) {
                var values = rows[i].split(","),
                    date = values[0];
                if (i === rows.length - 2) {
                    firstDate = date;
                }
                var closeValue = parseFloat(values[4]);
                var perClose = (Math.abs(closeValue - firstClose) * 100) / firstClose * (closeValue > firstClose ? 1 : -1),
                    volume = values[5],
                    adjClose = parseFloat(values[6]);

                stockValues.push([date, closeValue]);
            }

            var result = {
                stockValues: stockValues,
                firstDate: firstDate
            };
            cacheData("stock-history-" + stock.toLowerCase(), result);

            return result;
        });
    }

    function getNews() {
        var threeHours = 10800;
        var cache = getCacheData("stocks-news", threeHours);
        if (cache) {
            return WinJS.Promise.wrap(cache);
        }

        var url = "https://winjs-stocks.azure-mobile.net/api/getnews";
        var items = [];
        return WinJS.xhr({ url: url }).then(function (response) {
            var data = JSON.parse(response.responseText);
            if (data && data.feed && data.feed.entries && data.feed.entries.length > 0) {
                for (var i = 0, len = data.feed.entries.length; i < len; i++) {
                    items.push(data.feed.entries[i]);
                }
            }
            cacheData("stocks-news", items);
            return items;
        });
    }

    function cacheData(key, data) {
        window.localStorage[key] = JSON.stringify({
            date: new Date(),
            data: data
        })
    }

    function getCacheData(key, maxSeconds) {
        var secondsInADay = maxSeconds || 86400;
        var cache = window.localStorage[key];
        if (cache) {
            cache = JSON.parse(cache);
            if ((new Date() - new Date(cache.date)) / 1000 < secondsInADay) {
                return cache.data;
            }
        }
    }

    function getMarkets() {
        var threeHours = 10800;
        var cache = getCacheData("stock-markets-data", threeHours);
        if (cache) {
            return WinJS.Promise.wrap(cache);
        }

        var url = "https://winjs-stocks.azure-mobile.net/api/getmarkets";
        return WinJS.xhr({ url: url }).then(function (response) {
            var data = JSON.parse(response.responseText);

            for (var i = 0, len = data.length; i < len; i++) {
                data[i].changeArrow = (data[i].change >= 0 ? Stocks.Symbols.upArrow : Stocks.Symbols.downArrow);
            }
            cacheData("stock-markets-data", data);
            return data;
        });
    }

    WinJS.Namespace.define("Stocks.Data", {
        getStockInfo: getStockInfo,
        getStockHistory: getStockHistory,
        getNews: getNews,
        getMarkets: getMarkets
    });
})();
