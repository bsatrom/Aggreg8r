(function () {
    'use strict';

    var application = WinJS.Application;
    var navigation = WinJS.Navigation;
    var ui = WinJS.UI;
    var Popups = Windows.UI.Popups;
    var UICommand = Popups.UICommand;
    var MessageDialog = Popups.MessageDialog;
    var XDom = Windows.Data.Xml.Dom;

    var listRenderer;
    var headerRenderer;
    var itemRenderer;
    var pageLayout;

    var resource = {};
    var pageData = {};
    var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];

    // Custom event raised after the fragment is appended to the DOM.
    application.addEventListener('fragmentappended', function handler(e) {
        if (e.location === '/html/landingPage.html') { fragmentLoad(e.fragment, e.state); }
    });

    function updateForLayout(lv, layout) {
        pageLayout = layout;
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            ui.setOptions(lv, {
                dataSource: pageData.groups,
                itemRenderer: listRenderer,
                groupDataSource: null,
                groupRenderer: null,
                oniteminvoked: itemInvoked
            });

            lv.layout = new ui.ListLayout();
        } else {
            var groupDataSource = new ui.GroupDataSource(
                    new ui.ListDataSource(pageData.groups), function (item) {
                        return {
                            key: item.data.group.key,
                            data: {
                                title: item.data.group.title,
                                click: function () {
                                    navigation.navigate('/html/collectionPage.html', { group: item.data.group });
                                }
                            }
                        };
                    });

            ui.setOptions(lv, {
                dataSource: pageData.items,
                itemRenderer: itemRenderer,
                groupDataSource: groupDataSource,
                groupRenderer: headerRenderer,
                oniteminvoked: itemInvoked
            });
            lv.layout = new ui.GridLayout({ groupHeaderPosition: 'top' });
        }
        lv.refresh();
    }

    function layoutChanged(e) {
        var list = document.querySelector('.landingList');
        if (list) {
            var lv = ui.getControl(list);
            updateForLayout(lv, e.layout);
        }
    }

    function fragmentLoad(elements, options) {
        try {
            var appLayout = Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView();
            if (appLayout) {
                appLayout.addEventListener('layoutchanged', layoutChanged);
            }
        } catch (e) { }

        ui.processAll(elements)
            .then(function () {
                itemRenderer = elements.querySelector('.itemTemplate');
                headerRenderer = elements.querySelector('.headerTemplate');
                listRenderer = elements.querySelector('.listTemplate');
                var lv = ui.getControl(elements.querySelector('.landingList'));
                updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.value);
            });
    }

    function itemInvoked(e) {
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            var group = pageData.groups[e.detail.itemIndex];
            navigation.navigate('/html/collectionPage.html', { group: group });
        } else {
            var item = pageData.items[e.detail.itemIndex];
            navigation.navigate('/html/detailPage.html', { item: item });
        }
    }
   
    function getGroups() {
        var groups = [];
        
        groups.push({
            key: "channel9Build",
            title: "BUILD on Channel9",
            label: "BUILD on Channel9",
            resource: {
                url: "http://channel9.msdn.com/Events/BUILD/BUILD2011/RSS",
                params: []
            },
            getItems: processC9Data,
            backgroundColor: colors[1],
            description: "BUILD content on Channel 9",
            fullDescription: "BUILD content on Channel 9"
        });

        groups.push({
            key: "stackOverflow",
            title: "Stack Overflow",
            label: "Stack Overflow Tag Search",
            resource: {
                url: "http://api.stackoverflow.com/1.1/search?tagged=",
                delimiter: ";",
                params: ["winrt", "winjs", "win8", "metrostyle", "dev11"]
            },
            getItems: processSOData,
            backgroundColor: colors[0],
            description: "Stack Overflow Tag Search",
            fullDescription: "Stack Overflow Tag Search (WinRT, win8, Metro Style, WinJS)"
        });

        return groups;
    } 
        
    function getItems() {
        for (var i = 0, j = pageData.groups.length; i < j; i++) {
            var group = pageData.groups[i];
            var groupUrl = group.resource.url;
            
            for (var k = 0, l = group.resource.params.length; k < l; k++) {
                groupUrl += group.resource.params[k] + (k+1 !== group.resource.params.length ? group.resource.delimiter : '');
            }
            
            group.getItems(group, groupUrl);            
        }
    }

    function downloadError(e) {
        var error = JSON.parse(e.response);
        console.log("download failed at: " + new Date() + ". cause: " + error.error.message);
        var dialog = new MessageDialog("Error downloading posts. Try again?");
        var customCommands = [
            new UICommand("Yes", function () {
                pageData.groups = getGroups();
                getItems();
            }),
            new UICommand("No", function () {
                console.log("download terminated by user");
                WinJS.Application.stop();
            })
        ];
        
        dialog.defaultCommandIndex = 0;
        dialog.commands.replaceAll(customCommands);
        dialog.showAsync().then();
    }

    pageData.groups = getGroups();
    getItems();
    pageData.items = [];

    function processSOData(group, groupUrl) {
        var items = [];

        WinJS.xhr({ url: groupUrl }).then(function (request) {
            var response = JSON.parse(request.responseText);
            var length = response.questions.length > 8 ? 8 : response.questions.length;

            for (var i = 0; i < length; i++) {
                var question = response.questions[i];
                items.push({
                    group: group,
                    key: question.question_id,
                    title: question.title,
                    subtitle: "(Asked by " + question.owner.display_name + " [" + question.owner.reputation + "])",
                    backgroundColor: colors[i % colors.length]
                });
            }

            return items;
        }, downloadError).then(function (items) {
            var lv = ui.getControl(document.querySelector('.landingList'));
            addItemsToPageData(items);
            lv.dataSource = pageData.items;
        });
    }

    function processC9Data(group, groupUrl) {
        var items = [];

        var syn = new Windows.Web.Syndication.SyndicationClient();
        var url = new Windows.Foundation.Uri(groupUrl);

        syn.retrieveFeedAsync(url).then(function (request) {
            var length = request.items.length > 8 ? 8 : request.items.length;

            for (var i = 0; i < length; i++) {
                var post = request.items[i];
                items.push({
                    group: group,
                    key: i,
                    title: post.title.text,
                    subtitle: post.summary.text,
                    content: post.links[0].nodeValue,
                    description: post.summary.text,
                    backgroundColor: colors[i % colors.length]
                });
            }

            return items;
        }, downloadError).then(function (items) {
            var lv = ui.getControl(document.querySelector('.landingList'));
            addItemsToPageData(items);
            lv.dataSource = pageData.items;
        });
    }

    function addItemsToPageData(items) {
        if (pageData.items.length === 0) {
            pageData.items = items;
        } else {
            pageData.items = pageData.items.concat(items);
        }
    }
    
    WinJS.Namespace.define('landingPage', {
        fragmentLoad: fragmentLoad,
        itemInvoked: itemInvoked
    });
})();
