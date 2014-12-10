/*
 ---
 name: Litle Angularjs

 description: Provides an easier way to make use of Litle SDK with Angularjs

 license: MIT-style license

 requires: [angular, jquery]
 provides: [litle]

 ...
 */
(function(window, angular, $, undefined) {
    'use strict';

    /**
     * Function to generate UUID.
     * Taken from http://jsfiddle.net/briguy37/2MVFd/
     * @returns {string}
     */
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    }


    // Module global settings.
    var settings = {};

    // Module global flags.
    var flags = {
        sdk: false,
        loaded: false
    };

    /**
     * Litle module
     */
    angular.module('litle', []).

        // Declare module settings value
        value('settings', settings).

        // Declare module flags value
        value('flags', flags).

    /**
     * Litle provider
     */
    provider('Litle', [
        function() {
            /**
             * Litle paypageApiUrl
             * @type {Number}
             */
            settings.paypageApiUrl = null;

            this.setPagpageApiUrl = function(paypageApiUrl) {
                settings.paypageApiUrl = paypageApiUrl;
            };

            this.getPaypageApiUrl = function() {
                return settings.paypageApiUrl;
            };

            /**
             * Litle paypageApiJavascriptUrl
             * @type {Number}
             */
            settings.paypageApiJavascriptUrl = null;

            this.setPaypageApiJavascriptUrl = function(paypageApiJavascriptUrl) {
                settings.paypageApiJavascriptUrl = paypageApiJavascriptUrl;
            };

            this.getPaypageApiJavascriptUrl = function() {
                return settings.paypageApiJavascriptUrl;
            };

            /**
             * Litle paypageId
             * @type {Number}
             */
            settings.paypageId = null;

            this.setPaypageId = function(paypageId) {
                settings.paypageId = paypageId;
            };

            this.getPaypageId = function() {
                return settings.paypageId;
            };

            /**
             * Litle reportGroup
             * @type {Number}
             */
            settings.reportGroup = null;

            this.setReportGroup = function(reportGroup) {
                settings.reportGroup = reportGroup;
            };

            this.getReportGroup = function() {
                return settings.reportGroup;
            };

            settings.timeout = 5000;

            this.setTimeout = function(timeout) {
                settings.timeout = timeout
            };

            this.getTimeout = function() {
                return settings.timeout;
            };

            this.init = function(initSettings) {
                if (angular.isObject(initSettings)) {
                    angular.extend(settings, initSettings);
                }
            };

            /**
             * This defined the Litle service
             */
            this.$get = [
                '$q',
                '$rootScope',
                '$timeout',
                '$window',
                function($q, $rootScope, $timeout, $window) {
                    /**
                     * This is the NgLitle class to be retrieved on Litle Service request.
                     */
                    function NgLitle() { }

                    /**
                     * Ready state method
                     * @return {Boolean}
                     */
                    NgLitle.prototype.isLoaded = function() {
                        return flags.loaded;
                    };

                    NgLitle.prototype.sendToLitle = function($form, onSuccess, onError, onTimeout) {
                        var deferred = $q.defer();

                        if (!onSuccess) {
                            onSuccess = function(){};
                        }

                        if (!onError) {
                            onError = function(){};
                        }

                        if (!onTimeout) {
                            onTimeout = function(){};
                        }

                        var uuid = generateUUID();

                        var token = uuid.substr(0, 10) + "-" + (new Date().getTime());

                        var litleRequest = {
                            paypageId: settings.paypageId,
                            reportGroup: settings.reportGroup,
                            orderId: token,
                            id: token,
                            url: settings.paypageApiUrl
                        };

                        var fields = {
                            accountNum: $form.find("[name='cardNumber']").get(0),
                            cvv2: $form.find("[name='cardValidationNum']").get(0),
                            paypageRegistrationId: $form.find("[name='litlePaypageRegistrationId']").get(0),
                            bin: $form.find("[name='litleBin']").get(0)
                        };

                        new LitlePayPage().sendToLitle(litleRequest,
                            fields,
                            function(response) {
                                $rootScope.$broadcast('Litle.sendToLitle.success');
                                deferred.resolve(response);
                            },
                            function(response) {
                                $rootScope.$broadcast('Litle.sendToLitle.error');
                                deferred.reject(response);
                            },
                            function(response) {
                                $rootScope.$broadcast('Litle.sendToLitle.timeout');
                                deferred.reject({'timedOut': true});
                            },
                            settings.timeout);
                        return deferred.promise.then(function(response) {
                            onSuccess(response);
                        }, function(response) {
                            if (response.timedOut) {
                                onTimeout();
                            } else {
                                onError(response);
                            }
                        });
                    };

                    return new NgLitle(); // Singleton
                }
            ];

        }
    ]).

    /**
     * Module initialization
     */
    run([
        '$rootScope',
        function($rootScope) {
            /**
             * SDK script injecting
             */
            (function injectScript() {
                var src           = settings.paypageApiJavascriptUrl,
                    script        = document.createElement('script');
                script.id     = 'litle-sdk';
                script.async  = true;
                script.src = src;
                script.onload = function() {
                    flags.sdk = true; // Set sdk global flag
                    if (typeof new LitlePayPage() == 'object') {
                        flags.loaded = true;
                    } else {
                        flags.loaded = false;
                    }
                    $rootScope.$broadcast('Litle:sdk');
                };
                document.getElementsByTagName('head')[0].appendChild(script);
            })();
        }
    ]);

})(window, angular, $);
