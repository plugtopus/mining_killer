(function (window) {

    'use strict';

    var utils = {

        noop: function() {},

        getDefaultSettings: function() {
        
            var dfSettings = {};
            dfSettings['mkShowCount'] = true;
            dfSettings['mkShowAlert'] = false;
            dfSettings['mkRunStatus'] = true;
            dfSettings['mkFilters'] = true;
            dfSettings['mkWhiteList'] = [];
            dfSettings['mkUserFilters'] = [];

            return dfSettings;
        },

        getSettings: function(callback) {
            var self = this;
            chrome.storage.local.get('mkSettings', function(res) {
                if((Object.keys(res).length) === 0) {
                    res = self.getDefaultSettings();
                    self.setSettings(res);
                    callback(res);
                } else {
                    callback(res.mkSettings);
                }
            });

        },

        setSettings: function(settings, callback) {
            callback = (callback === undefined) ? this.noop : callback;
            chrome.storage.local.set({'mkSettings' : settings}, callback);
        },

        clearSettings: function(callback) {
            callback = (callback === undefined) ? this.noop : callback;
            chrome.storage.local.clear(callback);
        },

        setOption: function(option, value, callback) {
            var self = this;
            this.getSettings(function(res) {
                res[option] = value;
                self.setSettings(res, callback);
            });
        },

        getOption: function(option, callback) {
            var self = this;
            this.getSettings(function(res) {
                if(typeof(res[option]) === 'undefined') {
                    var dfSettings = self.getDefaultSettings();
                    res[option] = dfSettings[option];
                    self.setOption(option, dfSettings[option], function() {
                        callback(dfSettings[option]);
                    });
                } else {
                    callback(res[option]);
                }
            });
        },

        cleanArray: function(arr) {
            return arr.map(function(e){
                return e.trim();
            }).filter(function(str) { 
                return /^[^#]\S/.test(str);
            });
        },

        isValidFilter: function(filter) {
            return /^.*:\/\/.*\/.*?\*$/.test(filter);
        },

        getDomain: function(url) {
            return (url.split('/')[2] || url.split('/')[0]).split(':')[0];
        },

        getRootDomain: function(url) {
            var domain = this.getDomain(url);
            
            if(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(domain) === true) {
                return domain;
            }

            var pieces = domain.split('.');
            return pieces.slice((pieces.length > 2) ? 1 : 0).join('.');
        },

        checkWhiteList: function(url, array) {
            if(array === null) {
                return false;
            } else {
                return (array.indexOf(url) > -1);
            }
        },

        isSpecialTab(tab) {
            return /^((chrome:)|(chrome\-extension:)|(moz\-extension:)|(about:)|(file:)|(blob:)|(data:))/.test(tab.url);
        },

    };

    window.utils = utils;

}(window));