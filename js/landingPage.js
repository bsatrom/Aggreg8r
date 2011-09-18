(function () {
    'use strict';

    var application = WinJS.Application;
    var navigation = WinJS.Navigation;
    var ui = WinJS.UI;
    var Popups = Windows.UI.Popups;
    var UICommand = Popups.UICommand;
    var MessageDialog = Popups.MessageDialog;

    var listRenderer;
    var headerRenderer;
    var itemRenderer;
    var pageLayout;

    var resource = {};
    var pageData = {};
    
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
   
    function defineResources() {
        var resourceList = [];



        return resourceList;
    }
      
    // The getGroups() and getItems() functions contain sample data.
    // TODO: Replace with custom data.
    function getGroups() {
        var groups = [];
        
        groups.push({
            key: "stackOverflow",
            title: "Stack Overflow",
            label: "Stack Overflow Tag Search",
            resource: {
                url: "http://api.stackoverflow.com/1.1/search?tagged=",
                delimiter: ";",
                params: ["winrt", "winjs", "win8", "metrostyle", "dev11"]
            },
            backgroundColor: "rgba(209, 211, 212, 1)",
            description: "Stack Overflow Tag Search",
            fullDescription: "Stack Overflow Tag Search (WinRT, win8, Metro Style, WinJS)"
        });

        //groups.push({
        //    key: "channel9Build",
        //    title: "BUILD on Channel9",
        //    label: "BUILD on Channel9",
        //    resource: { url: "http://channel9.msdn.com/Events/BUILD/BUILD2011/RSS" },
        //    backgroundColor: "",
        //    description: "BUILD content on Channel 9",
        //    fullDescription: "BUILD content on Channel 9"
        //});

        return groups;
    } 

    //function getGroups() {
    //    var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
    //    var groups = [];

    //    for (var i = 0; i < 6; i++) {
    //        var even = (i % 2) === 0;
    //        groups.push({
    //            key: 'group' + i,
    //            title: 'Collection title lorem ' + i,
    //            backgroundColor: colors[i % colors.length],
    //            label: 'Eleifend posuere',
    //            description: even ? 'ǺSed nisl nibh, eleifend posuere.' : 'ǺSed nisl nibh, eleifend posuere laoreet egestas, porttitor quis lorem.',
    //            fullDescription: 'Ǻ Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum.' + (even ? '' : ' Ǻ Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum.')
    //        });
    //    }

    //    return groups;
    //}

    function getItems() {
        var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
        var items = [];

        for (var i = 0, j = pageData.groups.length; i < j; i++) {
            var group = pageData.groups[i];
            var groupUrl = group.resource.url;
            
            for (var k = 0, l = group.resource.params.length; k < l; k++) {
                groupUrl += group.resource.params[k] + (k+1 !== group.resource.params.length ? group.resource.delimiter : '');
            }

            WinJS.xhr({ url: groupUrl }).then(function (request) {
                JSON.parse(request);
                items.push({
                    group: pageData.groups[k],
                    key: request
                });
            }, downloadError);
        }

        for (var g = 0, gl = pageData.groups.length; g < gl; g++) {
            var numItems = g % 2 === 0 ? 6 : 4;
            for (var i = 0; i < numItems; i++) {
                items.push({
                    group: pageData.groups[g],
                    key: 'item' + i,
                    title: g + '.' + i + (i % 2 === 0 ? ' ǺSed nisl nibh, eleifend posuere.' : ' ǺSed nisl nibh, eleifend posuere laoreet egestas, porttitor quis lorem.'),
                    subtitle: 'Phasellus faucibus',
                    backgroundColor: colors[i % colors.length],
                    content: (new Array(16)).join('<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum clari, fiant sollemnes in futurum.</p>'),
                    description: 'Ǻ Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.'
                });
            }
        }

        return items;
    }

    function downloadError(e) {
        var error = JSON.parse(e.response);
        console.log("download failed at: " + new Date() + ". cause: " + error.error.message);
        var dialog = new MessageDialog("Error downloading posts. Try again?");
        var customCommands = [
            new UICommand("Yes", function () {
                pageData.groups = getGroups();
                pageData.items = getItems();
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
    pageData.items = getItems();

    WinJS.Namespace.define('landingPage', {
        fragmentLoad: fragmentLoad,
        itemInvoked: itemInvoked
    });
})();
