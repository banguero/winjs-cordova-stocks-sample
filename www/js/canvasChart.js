(function () {
    "use strict";

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    var seriesColors = [
        "#FFFFFF",
        "#0000CC",
        "#000000",
        "#99CC00",
        "#CCCCCC",
        "#33FFFF",
        "#993399",
        "#99FF99",
        "#6600CC",
        "#FF9966",
        "#666600",
        "#0033FF",
        "#CCCC00",
        "#FFFF00",
        "#FF00CC",
        "#666666",
        "#FFCC66",
        "#FFCC00",
        "#FF6600",
        "#CCFF66",
        "#FF9900",
        "#CCCC66",
        "#FF6666",
        "#996699",
        "#CC9900"
    ];

    var axisDateTypes = { short: 0, medium: 1, long: 2 };
    var graphBGColors = { test: -1, hot: 0, cool: 1, cold: 2, money: 3 };
    var testModes = { simple: 0, random: 1, date: 2, plusMinus: 3, array: 4 };
    var chartTypes = { line: 0, bar: 1 };
    var defaultTotalLegendHeight = (4 * 30) + 20;

    var chart = WinJS.Class.define(function CanvasChart_ctor(canvas, options) {
        this._element = canvas || document.createElement("canvas");
        this._options = options;
        this._gridLineWidth = 0.8;
        this._graphLineWidth = 3;
        this._pointLabelFontSize = 10;
        this._rangePad = .10; // The amount of padding we place around the chart edges and graphed points.
        this._gridRows = 8;
        this._gridCols = 8;
        this._axesFontSizeX = 8;
        this._axesFontSizeY = 8;
        this._axesPaddingX = 40;
        this._axesPaddingY = 60;
        this._axesLabelsAlpha = .6;
        this._xAxisDecimals = 2;
        this._yAxisDecimals = 2;

        this._element.winControl = this;
    },
    {
        element: {
            get: function () {
                return this._element;
            }
        },

        data: {
            get: function () {
                return this._data;
            },
            set: function (value) {
                this._data = value;
                this._initialize();
                this._drawBackground();
                this._drawChartGrid();
                this._chartPoints();
            }
        },

        _initialize: function () {
            var canvas = this.element;
            var thePoints = this.data;

            // Signals that the axes and some inputs must be parsed from date strings.
            this._dateAxes = false;
            this._axisDateType = axisDateTypes.short;

            // Default values for various chart features.
            this._drawLines = true;
            this._drawPointLabels = false;
            this._drawElbows = false;
            this._drawShadows = false;
            this._goldenMode = false;
            this._graphBGColor = graphBGColors.hot;
            this._testMode = testModes.random;
            this._chartType = chartTypes.line;
            this._context = canvas.getContext("2d");

            // Note: the boolean comparisons must test for false and true
            if (this._options) {
                if (typeof this._options.dateAxes === "boolean") {
                    this._dateAxes = this._options.dateAxes;
                }
                if (!isNaN(this._options.axisDateType)) {
                    this._axisDateType = this._options.axisDateType;
                }
                if (typeof this._options.drawLines === "boolean") {
                    this._drawLines = this._options.drawLines;
                }
                if (typeof this._options.drawPointLabels === "boolean") {
                    this._drawPointLabels = this._options.drawPointLabels;
                }
                if (typeof this._options.drawElbows === "boolean") {
                    this._drawElbows = this._options.drawElbows;
                }
                if (typeof this._options.drawShadows === "boolean") {
                    this._drawShadows = this._options.drawShadows;
                }
                if (typeof this._options.goldenMode === "boolean") {
                    this._goldenMode = this._options.goldenMode;
                }
                if (!isNaN(this._options.gridLineWidth)) {
                    this._gridLineWidth = this._options.gridLineWidth;
                }
                if (!isNaN(this._options.graphLineWidth)) {
                    this._graphLineWidth = this._options.graphLineWidth;
                }
                if (!isNaN(this._options.pointLabelFontSize)) {
                    this._pointLabelFontSize = this._options.pointLabelFontSize;
                }
                if (!isNaN(this._options.rangePad)) {
                    this._rangePad = this._options.rangePad;
                }
                if (!isNaN(this._options.gridRows)) {
                    this._gridRows = this._options.gridRows;
                }
                if (!isNaN(this._options.gridCols)) {
                    this._gridCols = this._options.gridCols;
                }
                if (!isNaN(this._options.axesFontSizeX)) {
                    this._axesFontSizeX = this._options.axesFontSizeX;
                }
                if (!isNaN(this._options.axesFontSizeY)) {
                    this._axesFontSizeY = this._options.axesFontSizeY;
                }
                if (!isNaN(this._options.axesPaddingX)) {
                    this._axesPaddingX = this._options.axesPaddingX;
                }
                if (!isNaN(this._options.axesPaddingY)) {
                    this._axesPaddingY = this._options.axesPaddingY;
                }
                if (!isNaN(this._options.axesLabelsAlpha)) {
                    this._axesLabelsAlpha = this._options.axesLabelsAlpha;
                }
                if (!isNaN(this._options.xAxisDecimals)) {
                    this._xAxisDecimals = this._options.xAxisDecimals;
                }
                if (!isNaN(this._options.yAxisDecimals)) {
                    this._yAxisDecimals = this._options.yAxisDecimals;
                }
                if (!isNaN(this._options.testMode)) {
                    this._testMode = this._options.testMode;
                }
                if (!isNaN(this._options.graphBGColor)) {
                    this._graphBGColor = this._options.graphBGColor;
                }
                if (!isNaN(this._options.chartType)) {
                    this._chartType = this._options.chartType;
                }
                if (this._options.legendNames) {
                    this._legendNames = this._options.legendNames;
                }
            }

            if (thePoints && this._chartType === chartTypes.bar) {
                this._gridCols = thePoints.length;
            }

            // Configure based on options.
            if (this._goldenMode) {
                // Try to make chart more beautiful by enforcing "golden ratio" on grid and graph.
                this._context.canvas.width = 1.61 * canvas.height;
            }

            // Calculate the area that the graph/chart will be drawn in.
            this._chartWidth = canvas.width - this._axesPaddingY;
            this._chartHeight = canvas.height - this._axesPaddingX;

            // Calculate the grid for background / scale.
            this._gridWidth = this._chartWidth / this._gridCols;  // This is the width of the grid cells (background and axes).
            this._gridHeight = this._chartHeight / this._gridRows; // This is the height of the grid cells (background axes).

            // Extend the canvas if we need to draw a legend
            if (this._legendNames && this._legendNames.length > 0) {
                canvas.height = this._context.canvas.height + defaultTotalLegendHeight;
            }

            this._context.save();
            this._context.clearRect(0, 0, canvas.width, canvas.height);
        },

        _arrayToPoints: function(pointsArray) {
            var thePoints = [];
            for (var i = 0, len = pointsArray.length; i < len; i++) {
                if (this._dateAxes) {
                    var yearMonthDay = pointsArray[i][0].split("-");
                    var month = parseInt(yearMonthDay[1]) - 1;  // The month value for the Date object is zero-based
                    var date = new Date(yearMonthDay[0], month, yearMonthDay[2]);
                    thePoints[i] = new Point(date, pointsArray[i][1]);
                } else {
                    thePoints[i] = new Point(pointsArray[i][0], pointsArray[i][1]);
                }
            }
            return thePoints;
        },

        _chartPoints: function () {
            var pointsArray = this.data;
            var thePoints = this.data;
            // Are we graphing dates? If so, we'll have to put dates on axes and so on.
            if (thePoints[0][0].x instanceof Date) {
                this._dateAxes = true;
            }

            for (var i = 0, len = thePoints.length; i < len; i++) {
                // Do we need to turn a 2d array into points?
                if (!(thePoints[i][0] instanceof Point)) {
                    thePoints[i] = this._arrayToPoints(pointsArray[i]);
                }

                // Sort the points so our line doesn't cross.
                thePoints[i].sort(this._pointCompare);
            }

            // Determine the scale for drawing axes / points.
            this._calculateScale(thePoints);

            this._drawAxes(thePoints);


            if (this._chartType === chartTypes.line) {
                this._graphPoints(thePoints);
            } else if (this._chartType === chartTypes.bar) {
                this._graphBars(thePoints);
            }

            if (this._legendNames && this._legendNames.length > 0) {
                this._drawLegend();
            }
        },

        _drawBackground: function() {
            if (this._chartType === chartTypes.line) {
                for (var i = 0; i < this._gridRows; i++) {
                    this._getColor(i);
                    this._context.fillRect(0, i * this._gridHeight, this._chartWidth, this._gridHeight);
                }
            }
        },

        _getColor: function(i) {
            switch (this._graphBGColor) {
                case graphBGColors.hot:
                    this._context.fillStyle = "rgb(" + Math.floor(255 - ((111 / this._gridRows) * i)) + "," + Math.floor(185 - ((185 / this._gridRows) * i)) + "," + Math.floor((80 / this._gridRows) * i) + ")";
                    break;
                case graphBGColors.cool:
                    this._context.fillStyle = "rgb(" + Math.floor((80 / this._gridRows) * i) + "," + Math.floor(185 - ((185 / this._gridRows) * i)) + "," + Math.floor(255 - ((111 / this._gridRows) * i)) + ")";
                    break;
                case graphBGColors.cold:
                    this._context.fillStyle = "rgb(" + Math.floor(185 - ((185 / this._gridRows) * i)) + "," + ((80 / this._gridRows) * i) + "," + Math.floor(255 - ((111 / this._gridRows) * i)) + ")";
                    break;
                case graphBGColors.money:
                    this._context.fillStyle = "rgb(" + Math.floor(90 - (80 / this._gridRows) * i) + "," + Math.floor(205 - ((155 / this._gridRows) * i)) + "," + Math.floor(90 - ((80 / this._gridRows) * i)) + ")";
                    break;
                default:
                    this._context.fillStyle = "rgb(" + Math.floor(150 - ((150 / this._gridRows) * i)) + "," + ((80 / this._gridRows) * i) + "," + Math.floor(255 - ((111 / this._gridRows) * i)) + ")";
                    break;
            }
        },

        _drawChartGrid: function() {
            for (var i = 0; i < this._gridCols; i++) {
                this._context.strokeStyle = "rgba(255,255,255, .7)";
                this._context.beginPath();
                this._context.moveTo(i * this._gridWidth, this._chartHeight);
                this._context.lineTo(i * this._gridWidth, 0);
                this._context.lineWidth = this._gridLineWidth;
                this._context.stroke();
            }
        },

        _getDateString: function(theDate, format) {
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var dateString;

            switch (format) {
                case axisDateTypes.short:
                    var month = months[theDate.getMonth()];
                    var day = theDate.getDate();
                    dateString = month + " " + day;
                    break;
                case axisDateTypes.medium:
                case axisDateTypes.long:
                default:
                    dateString = theDate.toDateString();
                    break;
            }
            return dateString;
        },

        _drawAxes: function (thePoints) {
            var xRange = this._scaleXMax - this._scaleXMin;
            var yRange = this._scaleYMax - this._scaleYMin;

            var xUnit = xRange / this._gridCols;
            var yUnit = yRange / this._gridRows;

            this._context.fillStyle = "rgba(255,255,255," + this._axesLabelsAlpha + ")";
            this._context.font = this._axesFontSizeY + "pt Arial";

            var text = "";

            // Draw the y-axes labels.
            for (var i = 1; i < this._gridRows; i++) {
                if (this._yAxisDecimals === 0) {
                    text = Math.round(this._scaleYMax - (i * yUnit));
                } else {
                    text = (this._scaleYMax - (i * yUnit)).toFixed(this._yAxisDecimals);
                }
                this._context.fillText(text, this._chartWidth + 5, i * this._gridHeight);
            }

            this._context.font = this._axesFontSizeX + "pt Arial";

            // Draw the x-axis labels
            if (this._chartType === chartTypes.line) {
                for (i = 0; i < this._gridCols; i++) {
                    text = "";
                    if (this._dateAxes) {
                        var date = new Date();
                        date.setTime(this._scaleXMin.getTime() + (i * xUnit));
                        text = this._getDateString(date, this._axisDateType);
                    } else {
                        text = Math.round(this._scaleXMin + (i * xUnit));
                    }
                    this._context.fillText(text, i * this._gridWidth, this._chartHeight + (this._axesPaddingX - this._axesFontSizeX));
                }
            }
            // For bar charts, draw all labels exactly as they appear in the Point structure.
            if (this._chartType === chartTypes.bar) {
                this._gridCols = thePoints[0].length;
                for (i = 0; i < this._gridCols; i++) {
                    text = "";
                    text += thePoints[0][i].x;
                    this._context.fillText(text, i * this._gridWidth, this._chartHeight + this._axesFontSizeY);
                }
            }
        },

        _calculateScale: function(thePoints) {
            this._scaleXMin = thePoints[0][0].x;
            this._scaleYMax = thePoints[0][0].y;
            this._scaleXMax = thePoints[0][0].x;
            this._scaleYMin = thePoints[0][0].y;
            for (var i = 0, len = thePoints.length; i < len; i++) {
                for (var j = 0, len2 = thePoints[i].length; j < len2; j++) {
                    if (this._scaleXMax < thePoints[i][j].x) {
                        this._scaleXMax = thePoints[i][j].x;
                    }
                    if (this._scaleYMax < thePoints[i][j].y) {
                        this._scaleYMax = thePoints[i][j].y;
                    }
                    if (this._scaleXMin > thePoints[i][j].x) {
                        this._scaleXMin = thePoints[i][j].y;
                    }
                    if (this._scaleYMin > thePoints[i][j].y) {
                        this._scaleYMin = thePoints[i][j].y;
                    }
                }
            }
        },

        _graphBars: function(thePoints) {
            var barsToGraph = thePoints[0].length - 1;

            var xRange = this._scaleXMax - this._scaleXMin;
            var xFactor = Math.round(xRange / this._gridCols);

            // Determine the scaling factor based on the min / max ranges.
            var yRange = this._scaleYMax - this._scaleYMin;

            var padX = this._chartWidth / 25;
            var padY = this._chartHeight / 25;

            var yFactor = (this._chartHeight - padY) / yRange;

            if (this._drawShadows) {
                this._context.shadowOffsetX = 2;
                this._context.shadowOffsetY = 2;
                this._context.shadowBlur = 4;
                this._context.shadowColor = "rgba(0, 0, 0, 0.5)";
            }
            this._context.fillStyle = "rgba(255,255,255, 1)";
            this._context.beginPath();

            var yStart = Math.round(this._chartHeight);

            for (var i = 0; i < barsToGraph; i++) {
                var xStart = Math.round(i * this._gridWidth) + Math.round(this._gridWidth / 2);
                var xFinish = Math.round((i + 1 * this._gridWidth) - this._gridWidth / 5) - Math.round(this._gridWidth / 2);
                var yFinish = Math.round(((thePoints[0][i].y - this._scaleYMin) * yFactor) - padY);
                this._getColor(i);
                this._context.fillRect(xStart + (this._gridWidth / 10), yFinish, this._gridWidth * .8, yStart - yFinish);
            }
        },

        _graphPoints: function (thePoints) {
            for (var seriesIndex = 0, numOfSeries = thePoints.length; seriesIndex < numOfSeries; seriesIndex++) {
                if (thePoints[seriesIndex].length > 1) {
                    var thisX, thisY, nextX, nextY, i, len;

                    // Determine the scaling factor based on the min / max ranges.
                    var xRange = this._scaleXMax - this._scaleXMin;
                    xRange += this._rangePad * xRange;
                    var yRange = this._scaleYMax - this._scaleYMin;
                    yRange += this._rangePad * yRange;

                    var padX = this._chartWidth / 25;
                    var padY = this._chartHeight / 25;

                    var xFactor = (this._chartWidth) / xRange;
                    var yFactor = (this._chartHeight - padY) / yRange;

                    // If we use a 'miterlimit' of .5 the elbow width, the elbow covers the line.
                    this._context.miterLimit = this._graphLineWidth / 4;

                    if (this._drawShadows) {
                        this._context.shadowOffsetX = 2;
                        this._context.shadowOffsetY = 2;
                        this._context.shadowBlur = 4;
                        this._context.shadowColor = "rgba(0, 0, 0, 0.5)";
                    }

                    this._context.strokeStyle = seriesColors[seriesIndex];
                    this._context.beginPath();

                    // Draw the points (elbows).
                    // Note: Moving this below the line drawing code will cause fills in the lines.
                    for (i = 0, len = thePoints[seriesIndex].length; i < len; i++) {
                        thisX = (thePoints[seriesIndex][i].x - this._scaleXMin) * xFactor, thisY = (thePoints[seriesIndex][i].y - this._scaleYMin) * yFactor;

                        if (this._drawElbows) {
                            this._context.moveTo(thisX, (this._chartHeight - thisY) - padY);
                            this._context.arc(thisX, (this._chartHeight - thisY) - padY, this._graphLineWidth / 2, 0, 360);
                            this._context.moveTo(thisX, (this._chartHeight - thisY) - padY);
                            this._context.fill();
                        }
                    }

                    // Move to the first point.
                    thisX = (thePoints[seriesIndex][0].x - this._scaleXMin) * xFactor, thisY = (thePoints[seriesIndex][0].y - this._scaleYMin) * yFactor;
                    nextX = (thePoints[seriesIndex][1].x - this._scaleXMin) * xFactor, nextY = (thePoints[seriesIndex][1].y - this._scaleYMin) * yFactor;
                    this._context.moveTo(thisX, (this._chartHeight - thisY) - padY);

                    // Draw a path for the line graph.
                    if (this._drawLines) {
                        for (i = 0, len = thePoints[seriesIndex].length; i < len - 1; i++) {
                            thisX = (thePoints[seriesIndex][i].x - this._scaleXMin) * xFactor, thisY = (thePoints[seriesIndex][i].y - this._scaleYMin) * yFactor;
                            nextX = (thePoints[seriesIndex][i + 1].x - this._scaleXMin) * xFactor, nextY = (thePoints[seriesIndex][i + 1].y - this._scaleYMin) * yFactor;

                            this._context.lineTo(nextX, (this._chartHeight - nextY) - padY);

                            this._context.lineWidth = this._graphLineWidth;
                        }
                        this._context.stroke();
                    }


                    // Draw the labels.
                    // Note: Moving this above the line drawing code will cause the lines to occlude labels.
                    for (i = 0, len = thePoints[seriesIndex].length; i < len; i++) {
                        thisX = (thePoints[seriesIndex][i].x - this._scaleXMin) * xFactor, thisY = (thePoints[seriesIndex][i].y - this._scaleYMin) * yFactor;

                        if (this._drawPointLabels) {
                            var text = "";
                            if (this._dateAxes) {
                                var date = new Date();
                                date.setTime(thePoints[seriesIndex][i].x);
                                text = date.toLocaleDateString();
                            } else {
                                text = Math.round(thePoints[seriesIndex][i].x).toString() + ", " + Math.round(thePoints[seriesIndex][i].y).toString();
                            }
                            this._context.fillStyle = "#FF0000";
                            this._context.font = this._pointLabelFontSize + "pt Arial";
                            this._context.fillText(text, thisX, (this._chartHeight - thisY) - padY);
                        }
                    }
                }
            }
        },

        _drawLegend: function() {
            var legendLineWidth = 40;
            var legendLineMarginX = 15;
            var legendLineMarginY = 30;
            var legendBoxMarginX = 5;
            var legendBoxMarginY = 15;
            var legendTextOffsetY = 5;
            var legendColor = "#FF0000";// "#FFFFFF";
            var legendFont = "10pt Segoe UI";
            var i, len;

            // Determine the widest legend text
            var widestTextSize = 0;
            for (i = 0, len = this._legendNames.length; i < len; i++) {
                this._context.font = legendFont;
                var currentTextWidth = this._context.measureText(this._legendNames[i]).width;
                if (currentTextWidth > widestTextSize) {
                    widestTextSize = currentTextWidth;
                }
            }

            // For calculating the optimal width of a single legend, we calculate the line width, space between the line and text,
            // margin between 2 legends and the width of the legend text. This is the divisor over the canvas width.
            var singleLegendWidth = legendLineWidth + legendLineMarginX + widestTextSize + legendBoxMarginX;
            var singleLegendHeight = legendLineMarginY;
            var numberOfLegendsX = Math.floor(this._chartWidth / singleLegendWidth);
            var numberOfLegendsY = Math.ceil(this._legendNames.length / numberOfLegendsX);
            var totalLegendWidth = singleLegendWidth * numberOfLegendsX;
            var totalLegendHeight = singleLegendHeight * numberOfLegendsY;

            // Extend the canvas based on the optimal size of the legend box
            var x = 0;
            var y = this._chartHeight + this._axesPaddingX + legendBoxMarginX;

            // Draw the outer box
            this._context.strokeStyle = legendColor;
            this._context.lineWidth = 1;
            this._context.strokeRect(x, y, this._chartWidth, totalLegendHeight);

            // Draw the individual legends
            this._context.lineWidth = this._graphLineWidth;
            x = legendBoxMarginX;
            y += legendBoxMarginY;
            var legendCounterX = 1;
            for (i = 0, len = this._legendNames.length; i < len; i++) {
                this._context.beginPath();

                // Draw the legend line
                this._context.strokeStyle = seriesColors[i];
                this._context.moveTo(x, y);
                this._context.lineTo(x + legendLineWidth, y);
                this._context.stroke();

                // Draw the text with the legend name
                x += legendLineWidth + legendLineMarginX;
                this._context.moveTo(x, y);
                this._context.fillStyle = legendColor;
                this._context.font = legendFont;
                this._context.fillText(this._legendNames[i], x, y + legendTextOffsetY);

                // Move on to the next legend name/line. If this will take us over the right margin, we go to the next line
                x += widestTextSize + legendBoxMarginX;
                ++legendCounterX;
                if (legendCounterX > numberOfLegendsX) {
                    legendCounterX = 1;
                    x = legendBoxMarginX;
                    y += singleLegendHeight;
                }
            }
        },

        _pointCompare: function(left, right) {
            if (left.x > right.x) {
                return 1;
            }
            if (left.x === right.x) {
                return 0;
            }
            return -1;
        }
    });
    WinJS.Namespace.define("Stocks.Controls", {
        CanvasChart: chart
    });
})();