(function () {

    'use strict';

    var utils,
        selectElement;

    function loopEls(className, callback) {
        Array.prototype.forEach.call(document.getElementsByClassName(className), callback);
    }

    function initOptionPage() {

        utils = chrome.extension.getBackgroundPage().utils;
        selectElement = document.getElementById('mkWhiteList');

        toggleTab(document.getElementsByClassName('tablinks')[0], 0);
        loopEls('tablinks', addTabClickListener);

        loopEls('opt', function(e) {

            utils.getOption(e.id, function(value) {
                updateOption(e, value);
            });

            if(e.tagName === 'INPUT' && e.getAttribute('type') === 'checkbox') {
                e.addEventListener('click', toggleCheckBox);
            }

        });

        loopEls('btn', function(e) {
            if(e.id === 'mkUserFiltersSave') {
                e.addEventListener('click', saveUserFilters);

            } else if(e.id === 'mkWhiteListAdd') {
                e.addEventListener('click', addWhiteListDomain);

            } else if(e.id === 'mkWhiteListRemove') {
                e.addEventListener('click', removeWhiteListDomain);
            }

        });
    }

    function removeWhiteListDomain() {
        if(selectElement.selectedIndex !== -1) {
            utils.getOption('mkWhiteList', function(value) {
                value.splice(selectElement.selectedIndex, 1);
                utils.setOption('mkWhiteList', value, function() {
                    populateSelect(selectElement, value);
                    notifyBackground();
                });
            });
        }
    }

    function addWhiteListDomain() {
        var wdomainEl = document.getElementById('mkWhiteListDomain');
        var wdomainText = wdomainEl.value.trim();

        if(wdomainText.length) {
            utils.getOption('mkWhiteList', function(value) {

                if(value === null) {
                    value = [];
                }

                wdomainText = utils.getDomain(wdomainText);

                var isUrlwListed = utils.checkWhiteList(wdomainText, value);
                if(isUrlwListed) {
                    return;
                }

                value.push(wdomainText);
                utils.setOption('mkWhiteList', value, function() {
                    wdomainEl.value = '';
                    populateSelect(selectElement, value);
                    notifyBackground();
                });

            });
        }
    }

    function saveUserFilters() {
        var flistElement = document.getElementById('mkUserFilters'),
            dlist;

        flistElement.addEventListener('click', function() {
            flistElement.style.borderColor = '#ccc';
        });

        if(flistElement.value.length) {
            dlist = utils.cleanArray(flistElement.value.split('\n'));
            var prop;
            for(prop in dlist) {
                if(!utils.isValidFilter(dlist[prop])) {
                    flistElement.style.borderColor = 'red';
                    return;
                }
            }

        } else {
            var dfs = utils.getDefaultSettings();
            dlist = dfs['mkUserFilters'];
        }
        utils.setOption('mkUserFilters', dlist, function() {
            flistElement.style.borderColor = 'green';
            notifyBackground();
        });
    }

    function toggleCheckBox(e) {
        var targetElement = e.target;
        utils.setOption(targetElement.id, targetElement.checked, function() {
            notifyBackground();
        });
    }

    function populateSelect(e, value) {
        e.innerHTML = '';
        var prop;
        for(prop in value) {
            var optTag = document.createElement("option");
            optTag.value = prop;
            optTag.appendChild(document.createTextNode(value[prop]));
            e.appendChild(optTag);
        }
    }

    function updateOption(e, value) {
        if(e.tagName === 'INPUT' && e.getAttribute('type') === 'checkbox') {
            e.checked = value;

        } else if(e.tagName === 'TEXTAREA') {
            if(value !== null) {
                e.value = value.join('\n');
            }

        } else if (e.tagName === 'SELECT') {
            populateSelect(e, value);

        }
    }

    function addTabClickListener(el ,index) {
        el.addEventListener('click', function () {
            toggleTab(el, index);
        });
    }

    function toggleContainers(activeIndex) {
        loopEls('tab-cnt', function(e, i) {
            if(i === activeIndex) {
                e.style.display = 'block';
            } else {
                e.style.display = 'none';
            }
        });
    }

    function toggleTab(elm, elIndex) {
        elm.style.backgroundColor = '#fff';
        elm.style.borderBottom = '1px solid #fff';

        loopEls('tablinks', function(el, index) {
            if(index === elIndex) {
                return;
            }
            el.style.backgroundColor = '#eee';
            el.style.borderBottom = '1px solid #ccc';
            toggleContainers(elIndex);

        });
    }

    function notifyBackground() {
        chrome.runtime.sendMessage({action: 'optionUpdated'}, utils.noop);
    }

    initOptionPage();

}());