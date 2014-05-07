'use strict';

angular.module('myApp', ['ngResource', 'emguo.poller', 'hljs'])

    .factory('greet1', function ($resource) {
        return $resource('https://angularjs.org/greet.php',
            {
                callback: 'JSON_CALLBACK',
                name: 'Emma'
            },
            {
                jsonp_get: { method: 'JSONP' }
            });
    })

    .factory('greet2', function ($resource) {
        return $resource('https://angularjs.org/greet.php',
            {
                callback: 'JSON_CALLBACK',
                name: 'You'
            },
            {
                jsonp_get: { method: 'JSONP' }
            });
    })

    // Config angular-highlightjs
    .config(function (hljsServiceProvider) {
        hljsServiceProvider.setOptions({
            languages: ['javascript']
        });
    })

    .controller('myController', function ($scope, poller, greet1, greet2) {
        var poller1, poller2;

        /*-- Automatically start poller1 on page load --*/
        poller1 = poller.get(greet1, {action: 'jsonp_get', delay: 1000});
        poller1.promise.then(null, null, function (data) {
            $scope.data1 = data;
        });

        /*-- Actions --*/
        $scope.stop = function () {
            poller1.stop();
        };

        $scope.restart = function () {
            poller1 = poller.get(greet1);
        };

        $scope.faster = function () {
            poller1 = poller.get(greet1, {delay: 300});
        };

        $scope.slower = function () {
            poller1 = poller.get(greet1, {delay: 1500});
        };

        $scope.startPoller2 = function () {
            poller2 = poller.get(greet2, {action: 'jsonp_get', delay: 1000});
            poller2.promise.then(null, null, function (data) {
                $scope.data2 = data;
            });
        };

        $scope.stopBoth = function () {
            poller.stopAll();
        };

        $scope.restartBoth = function () {
            poller.restartAll();
        };
    });