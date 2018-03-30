'use strict';

var pauseIcon = 'img/19off.png',
    startIcon = 'img/19.png',
    mkTabs = {},
    mkwTabs = [],
    urls = [],
    currentTabId,
    mkSettings;

function HTTPGetText(url, handleReqListener, handleReqError) {
    var oReq = new XMLHttpRequest();
    oReq.onload = handleReqListener;
    oReq.onerror = handleReqError;
    oReq.open('get', url, true);
    oReq.send();
}

function handleReqListener() {
    var data = this.responseText;
}

function handleReqError(err) {
    console.log('Error: ', err);
}

function initBackground() {

    updateSettings(function(value) {
        initListeners(value['mkRunStatus']);
    });
}

function updateSettings(callback) {
    utils.getSettings(function(value) {
        mkSettings = value;

        HTTPGetText(chrome.runtime.getURL('assets/blacklist.txt'), function() {

            if (mkSettings['mkFilters']) {
                var data = this.responseText;
                data = data.split('\n');
                data = utils.cleanArray(data);
                urls = urls.concat(data);
            }
            urls = urls.concat(mkSettings['mkUserFilters']);

            callback(value);

        }, handleReqError);

    });
}

function updateIcon(status, ctabId) {
    var icon = (status === true) ? startIcon : pauseIcon;
    if (ctabId === undefined) {
        chrome['browserAction'].setIcon({
            path: icon
        });
    } else {
        chrome['browserAction'].setIcon({
            path: icon,
            tabId: ctabId
        });
    }

}

function changeMkStatus(status) {
    initListeners(status);
    mkSettings['mkRunStatus'] = status;
    utils.setOption('mkRunStatus', status, utils.noop);
}

function addwList(url) {
    var isUrlwListed = utils.checkWhiteList(url, mkSettings['mkWhiteList']);

    if (isUrlwListed) {
        return;
    }

    if (mkSettings['mkWhiteList'] === null) {
        mkSettings['mkWhiteList'] = [];
    }

    mkSettings['mkWhiteList'].push(url);

    utils.setOption('mkWhiteList', mkSettings['mkWhiteList'], utils.noop);

}

function removewList(url) {
    var isUrlwListed = utils.checkWhiteList(url, mkSettings['mkWhiteList']);

    if (!isUrlwListed) {
        return;
    }

    var urlIndex = mkSettings['mkWhiteList'].indexOf(url);

    if (urlIndex > -1) {
        mkSettings['mkWhiteList'].splice(urlIndex, 1);
        utils.setOption('mkWhiteList', mkSettings['mkWhiteList'], utils.noop);
    }

}

function updateBadge(mcount, tabId) {
    chrome['browserAction'].setBadgeBackgroundColor({
        color: (mcount == 0) ? 'green' : 'red',
        tabId: tabId
    });

    chrome['browserAction'].setBadgeText({
        text: String(mcount),
        tabId: tabId
    });
}

function addmkTab(tabId, rootDomain) {
    if (tabId in mkTabs) {
        if (mkTabs[tabId].indexOf(rootDomain) === -1) {
            mkTabs[tabId].push(rootDomain);
        }

    } else {
        mkTabs[tabId] = [rootDomain];
    }
}

function handleOnUpdatedListener(tabId, changeInfo, tab) {

    var tabwIndex = mkwTabs.indexOf(tabId);

    if (changeInfo && changeInfo.url) {

        if (tabId in mkTabs) {
            delete mkTabs[tabId];
        }

        var isUrlwListed = utils.checkWhiteList(utils.getDomain(changeInfo.url), mkSettings['mkWhiteList']);
        if (isUrlwListed) {
            if (tabwIndex < 0) {
                mkwTabs.push(tabId);
            }
        } else {
            if (tabwIndex > -1) {
                mkwTabs.splice(tabwIndex, 1);
            }
        }
    }
}

function handleOnRemovedListener(tabId) {
    if (tabId in mkTabs) {
        delete mkTabs[tabId];
    }
}

function handleOnBeforeRequest(details) {

    if (details.tabId === -1 || mkwTabs.indexOf(details.tabId) > -1) {
        return {
            cancel: false
        };
    }

    var rootDomain = utils.getRootDomain(details.url);
    if (details.tabId in mkTabs) {
        if (mkTabs[details.tabId].indexOf(rootDomain) === -1) {
            mkTabs[details.tabId].push(rootDomain);
        }

    } else {
        mkTabs[details.tabId] = [rootDomain];
    }

    if (mkSettings['mkShowCount']) {
        updateBadge(mkTabs[details.tabId].length, details.tabId);
    }

    return {
        cancel: true
    };
}

function initListeners(stat) {

    if (urls.length === 0) {
        return;
    }

    if (chrome['tabs'].onUpdated.hasListener(handleOnUpdatedListener)) {
        chrome['tabs'].onUpdated.removeListener(handleOnUpdatedListener);
    }

    if (chrome['tabs'].onRemoved.hasListener(handleOnRemovedListener)) {
        chrome['tabs'].onRemoved.removeListener(handleOnRemovedListener);
    }

    if (chrome.webRequest.onBeforeRequest.hasListener(handleOnBeforeRequest)) {
        chrome.webRequest.onBeforeRequest.removeListener(handleOnBeforeRequest);
    }

    if (stat == true) {
        chrome['tabs'].onUpdated.addListener(handleOnUpdatedListener);
        chrome['tabs'].onRemoved.addListener(handleOnRemovedListener);
        chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequest, {
            urls: urls
        }, ['blocking']);
    }
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action == 'mkPause') {
        changeMkStatus(false);

    } else if (message.action == 'mkStart') {
        changeMkStatus(true);

    } else if (message.action == 'addWlist') {
        var domain = utils.getDomain(message.tab.url);
        addwList(domain);

        if (message.tab.id in mkTabs) {
            delete mkTabs[message.tab.id];
        }

        var tabwIndex = mkwTabs.indexOf(message.tab.id);
        if (tabwIndex < 0) {
            mkwTabs.push(message.tab.id);
        }

    } else if (message.action == 'removeWlist') {
        var domain = utils.getDomain(message.tab.url);
        removewList(domain);

        var tabwIndex = mkwTabs.indexOf(message.tab.id);
        if (tabwIndex > -1) {
            mkwTabs.splice(tabwIndex, 1);
        }

    } else if (message.action == 'optionUpdated') {
        urls = [];
        mkwTabs = [];
        initBackground();

    } else if (message.action == 'minerBlockedFromContent') {

        addmkTab(sender.tab.id, message.minerUrl);

        if (mkSettings['mkShowCount']) {
            updateBadge(mkTabs[sender.tab.id].length, sender.tab.id);
        }

    } else if (message.action == 'getmKillStatus') {
        if (mkSettings['mkRunStatus'] === false) {
            sendResponse({
                mKillStatus: false
            });

        } else {
            var isUrlwListed = utils.checkWhiteList(utils.getRootDomain(message.url), mkSettings['mkWhiteList']);
            sendResponse({
                mKillStatus: !isUrlwListed
            });
        }
    }

});

initBackground();