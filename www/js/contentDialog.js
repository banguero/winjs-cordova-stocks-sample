(function () {
    function defaultRenderer(dataPromise) {
        return dataPromise.then(function (item) {
            var element = document.createElement("div");
            element.innerHTML = item.data;
            return element;
        });
    }

    var cd = WinJS.Class.define(function ContentDialog_ctor(element, options) {
        this._element = element || document.createElement("div");
        this._element.classList.add("win-contentdialog");
        this._element.winControl = this;
        options = options || {};

        this._initialize();

        this.titleTemplate = options.titleTemplate || defaultRenderer;
        this.contentTemplate = options.contentTemplate || defaultRenderer;

        this.title = options.title || "";
        if (options.content) {
            this.content = options.content;
        }

        var that = this;
        window.addEventListener("backkeypress", function (e) {
            if (!that.hidden) {
                that.hide();
                e.preventDefault();
            }
        });
        window.addEventListener("keyup", function (e) {
            if (!that.hidden && e.key === "Esc") {
                that.hide();
            }
        });

        this.okText = options.okText || "";
        this.cancelText = options.cancelText || "";
        this.commands = options.commands || this._createDefaultCommands();
        this.buttonsVisible = options.buttonVisible === undefined ? true : options.buttonsVisible;

        this._constructed = true;

        this._updateCommands();
    }, {
        element: {
            get: function () {
                return this._element;
            }
        },

        title: {
            get: function () {
                return this._title;
            },
            set: function (value) {
                this._title = value;

                this._render(value, this._titleRenderer, this._titleSpace);
            }
        },

        titleTemplate: {
            get: function () {
                return this._titleTemplate;
            },
            set: function (value) {
                value = value || defaultRenderer;

                this._titleTemplate = value;
                this._setRenderer("title", value);

                if (this._constructed) {
                    this.title = this.title;
                }
            }
        },

        content: {
            get: function () {
                return this._content;
            },
            set: function (value) {
                this._content = value;

                this._render(value, this._contentRenderer, this._contentSpace);
            }
        },

        contentTemplate: {
            get: function () {
                return this._contentTemplate;
            },
            set: function (value) {
                value = value || defaultRenderer;

                this._contentTemplate = value;
                this._setRenderer("content", value);

                if (this._constructed) {
                    this.content = this.content;
                }
            }
        },

        commands: {
            get: function () {
                return this._commands;
            },
            set: function (value) {
                this._commands = value || this._createDefaultCommands();
                this._updateCommands();
            }
        },

        hidden: {
            get: function () {
                return !this.element.classList.contains("win-opened");
            }
        },

        fullModeRequired: {
            get: function () {
                return this._fullModeRequired;
            },
            set: function (value) {
                this._fullModeRequired = value;
            }
        },

        buttonsVisible: {
            get: function () {
                return this._buttonsVisible;
            },
            set: function (value) {
                this._buttonsVisible = value;
                if (value) {
                    this._commandSpace.classList.remove("win-collapsed");
                } else {
                    this._commandSpace.classList.add("win-collapsed");
                }
            }
        },

        show: function () {
            this.element.classList.add("win-opened");

            var titleSpaceStyle = getComputedStyle(this._titleSpace);
            var titleSpace = parseFloat(titleSpaceStyle.height) + parseFloat(titleSpaceStyle.marginTop) + parseFloat(titleSpaceStyle.marginBottom);

            var contentSpaceStyle = getComputedStyle(this._contentSpace);
            var contentSpace = parseFloat(contentSpaceStyle.height) + parseFloat(contentSpaceStyle.marginTop) + parseFloat(contentSpaceStyle.marginBottom);

            var commandSpace = 0;
            if (this.buttonsVisible) {
                var commandSpaceStyle = getComputedStyle(this._commandSpace);
                commandSpace = parseFloat(commandSpaceStyle.height) + parseFloat(commandSpaceStyle.marginTop) + parseFloat(commandSpaceStyle.marginBottom);
            }

            this._dialogRoot.style.height = "";

            var ev = document.createEvent("CustomEvent");
            ev.initCustomEvent("opened", true, true, window);
            this.element.dispatchEvent(ev);
        },

        hide: function () {
            this.element.classList.remove("win-opened");

            var ev = document.createEvent("CustomEvent");
            ev.initCustomEvent("closed", true, true, window);
            this.element.dispatchEvent(ev);
        },

        okText: {
            get: function () {
                return this._okText;
            },
            set: function (value) {
                this._okText = value === null ? "" : value;
                this.commands = this._createDefaultCommands();
            }
        },

        cancelText: {
            get: function () {
                return this._cancelText;
            },
            set: function (value) {
                this._cancelText = value === null ? "" : value;
                this.commands = this._createDefaultCommands();
            }
        },

        _initialize: function () {
            var that = this;

            this._dialogRoot = document.createElement("div");
            this._dialogRoot.classList.add("win-contentdialog-dialogroot");

            this._titleSpace = document.createElement("div");
            this._titleSpace.classList.add("win-contentdialog-titlespace");

            this._contentSpace = document.createElement("div");
            this._contentSpace.classList.add("win-contentdialog-contentspace");

            this._commandSpace = document.createElement("div");
            this._commandSpace.classList.add("win-contentdialog-commandspace");

            this._dialogRoot.appendChild(this._titleSpace);
            this._dialogRoot.appendChild(this._contentSpace);
            this._dialogRoot.appendChild(this._commandSpace);

            while (this.element.children.length) {
                this._contentSpace.appendChild(this.element.children[0]);
            }
            this.element.appendChild(this._dialogRoot);
        },

        _setRenderer: function (type, template) {
            var itemRenderer = null;
            if (typeof template === "function") {
                var itemPromise = new WinJS.Promise(function (c, e, p) { });
                var templateResult = template(itemPromise);
                if (templateResult.element) {
                    if (typeof templateResult.element === "object" && typeof templateResult.element.then === "function") {
                        // This renderer returns a promise to an element
                        itemRenderer = function (itemPromise) {
                            var elementRoot = document.createElement("div");
                            elementRoot.className = "win-template";
                            WinJS.Utilities.markDisposable(elementRoot);
                            return {
                                element: elementRoot,
                                renderComplete: template(itemPromise).element.then(function (element) {
                                    elementRoot.appendChild(element);
                                })
                            };
                        };
                    } else {
                        // This renderer already returns a placeholder
                        itemRenderer = template;
                    }
                } else {
                    // Return a renderer that has return a placeholder
                    itemRenderer = function (itemPromise) {
                        var elementRoot = document.createElement("div");
                        elementRoot.className = "win-template";
                        WinJS.Utilities.markDisposable(elementRoot);
                        // The pagecompleted event relies on this elementRoot
                        // to ensure that we are still looking at the same
                        // item after the render completes.
                        return {
                            element: elementRoot,
                            renderComplete: itemPromise.then(function (item) {
                                return WinJS.Promise.as(template(itemPromise)).then(function (element) {
                                    elementRoot.appendChild(element);
                                });
                            })
                        };
                    }
                };
            } else if (typeof template === "object") {
                itemRenderer = template.renderItem;
            }
            this["_" + type + "Renderer"] = itemRenderer;
        },

        _render: function (data, renderer, target) {
            WinJS.Utilities.empty(target);

            if (data instanceof HTMLElement) {
                target.appendChild(data);
            } else {
                WinJS.Promise.wrap(renderer(WinJS.Promise.wrap({ data: data }))).then(function (result) {
                    WinJS.Promise.wrap(result.element).then(function (element) {
                        target.appendChild(element);
                    });
                });
            }
        },

        _createDefaultCommands: function () {
            var commands = [];
            var that = this;
            if (this._okText) {
                commands.push(new Stocks.Controls.ContentDialogCommand(this._okText, function () {
                    var ev = document.createEvent("CustomEvent");
                    ev.initCustomEvent("okclick", true, true, window);
                    that.element.dispatchEvent(ev);
                }));
            }
            if (this._cancelText) {
                commands.push(new Stocks.Controls.ContentDialogCommand(this._cancelText, function () {
                    var ev = document.createEvent("CustomEvent");
                    ev.initCustomEvent("cancelclick", true, true, window);
                    that.element.dispatchEvent(ev);
                }));
            }
            return commands;
        },

        _updateCommands: function () {
            if (!this._constructed) {
                return;
            }

            WinJS.Utilities.empty(this._commandSpace);

            for (var i = 0; i < Math.min(2, this.commands.length) ; i++) {
                var command = this.commands[i];

                var btn = document.createElement("button");
                btn.innerHTML = command.text;
                btn.classList.add("win-contentdialog-command");
                btn.addEventListener("click", command.onclick);

                this._commandSpace.appendChild(btn);
            }
        }
    });

    var cdc = WinJS.Class.define(function ContentDialogCommand(text, onclickHandler) {
        this.text = text;
        this.onclick = onclickHandler;
    }, {
        text: {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
            }
        },

        onclick: {
            get: function () {
                return this._handler;
            },
            set: function (value) {
                this._handler = value;
            }
        },
    });

    WinJS.Namespace.define("Stocks.Controls", {
        ContentDialog: cd,
        ContentDialogCommand: cdc
    });
})();