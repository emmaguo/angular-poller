# Angular Poller
Lightweight [AngularJS](http://angularjs.org/) poller service which can be easily injected into controllers. It uses a timer and sends requests every few seconds to keep the client synced with the server.

If you need the data to be exact real-time such as in a chat box, you should use long polling or WebSocket instead.

## Install
Download [angular-poller.min.js](https://raw.github.com/emmaguo/angular-poller/master/angular-poller.min.js) or simply run: `bower install angular-poller`.

## Basic Usage
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['poller']);

myModule.controller('myController', function($scope, $resource, poller) {

    // Define your resource object.
    var myResource = $resource(url[, paramDefaults]);

    // Get poller. This also starts/restarts poller.
    var myPoller = poller.get(myResource);

    // Update view. Most likely you only need to define notifyCallback.
    myPoller.promise.then(successCallback, errorCallback, notifyCallback);

    // Stop poller.
    myPoller.stop();

    // Stop all pollers.
    poller.stopAll();
});
```

## Advanced Usage
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['poller']);

myModule.controller('myController', function($scope, $resource, poller) {

    // Define your resource object.
    var myResource = $resource(url[, paramDefaults], {
        myQuery: {
            method: 'GET',
            isArray: true,
            headers: ...
        },
        ...
    });

    // Get poller.
    var myPoller = poller.get(myResource, {
        action: 'myQuery',
        delay: 6000,
        params: {
            verb: 'greet',
            salutation: 'Hello'
        }
    });

    myPoller.promise.then(successCallback, errorCallback, notifyCallback);
});
```