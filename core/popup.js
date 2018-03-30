(function() {

    'use strict';

    var utils;

    function initPopupPage() {
        utils = chrome.extension.getBackgroundPage().utils;

        initWhiteListBtnStatus();

        document.getElementById('startButton').addEventListener('click', function(e) {
            chrome.runtime.sendMessage({
                action: 'mkStart'
            }, utils.noop);
            chrome.extension.getBackgroundPage().updateIcon(true);
            chrome['tabs'].reload();
            window.close();
        });

        document.getElementById('pauseButton').addEventListener('click', function(e) {
            chrome.runtime.sendMessage({
                action: 'mkPause'
            }, utils.noop);
            chrome.extension.getBackgroundPage().updateIcon(false);
            chrome['tabs'].reload();
            window.close();
        });

        document.getElementById('settingsBtn').addEventListener('click', function(e) {
            chrome.runtime.openOptionsPage();
            window.close();
        });

        document.getElementById('addWlist').addEventListener('click', function(e) {
            chrome['tabs'].query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                if (!tabs) {
                    return;
                }
                var ctab = tabs[0];
                if (utils.isSpecialTab(ctab)) {
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'addWlist',
                    tab: ctab
                }, utils.noop);
                chrome['tabs'].reload(ctab.tabId);
                window.close();
            });
        });

        document.getElementById('removeWlist').addEventListener('click', function(e) {
            chrome['tabs'].query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                if (!tabs) {
                    return;
                }
                var ctab = tabs[0];
                chrome.runtime.sendMessage({
                    action: 'removeWlist',
                    tab: ctab
                }, utils.noop);
                chrome['tabs'].reload(ctab.tabId);
                window.close();
            });
        });

    }

    function initWhiteListBtnStatus() {
        chrome['tabs'].query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (!tabs) {
                return;
            }
            var ctab = tabs[0];
            var domain = utils.getDomain(ctab.url);
            var wlistStatus = utils.checkWhiteList(domain, chrome.extension.getBackgroundPage().mkSettings['mkWhiteList']);

            if (wlistStatus) {
                setWlistStatus(true);

            } else {
                setWlistStatus(false);
                initSuspendBtn(ctab.id);
            }
        });
    }

    function initSuspendBtn(tabId) {
        utils.getOption('mkRunStatus', function(value) {
            setBtnStatus(value);
            chrome.extension.getBackgroundPage().updateIcon(value);
            initBlockCount(tabId);
        });
    }

    function initBlockCount(tabId) {
        var mkTabstmp = chrome.extension.getBackgroundPage().mkTabs;

        if (tabId in mkTabstmp) {
            document.getElementById('blockedNum').innerText = mkTabstmp[tabId].length;
            var prop,
                trEl,
                tdEl,
                tableEl = document.getElementById('blockedDomains');

            for (prop in mkTabstmp[tabId]) {
                trEl = document.createElement('tr');
                tdEl = document.createElement('td');
                tdEl.innerText = mkTabstmp[tabId][prop];
                trEl.appendChild(tdEl);
                tableEl.appendChild(trEl);
            }
        } else {
            document.getElementById('blockedNum').innerText = 0;
        }

    }

    function setWlistStatus(status) {
        document.getElementById('addWlist').style.display = (status === true) ? 'none' : '';
        document.getElementById('removeWlist').style.display = (status === true) ? '' : 'none';
        document.getElementById('hideWl').style.display = (status === true) ? 'none' : '';
    }

    function setBtnStatus(status) {
        document.getElementById('pauseButton').style.display = (status === true) ? '' : 'none';
        document.getElementById('startButton').style.display = (status === true) ? 'none' : '';
        document.getElementById('hidePs').style.display = (status === true) ? '' : 'none';
    }

    function loopEls(className, callback) {
        Array.prototype.forEach.call(document.getElementsByClassName(className), callback);
    }

    document.addEventListener('DOMContentLoaded', function() {
        initPopupPage();
    });

}());