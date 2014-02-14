# Angular Poller
[![devDependency Status](https://david-dm.org/emmaguo/angular-poller.png)](https://david-dm.org/emmaguo/angular-poller#info=devDependencies)
[![Build Status](https://travis-ci.org/emmaguo/angular-poller.png)](https://travis-ci.org/emmaguo/angular-poller)

Lightweight [AngularJS](http://angularjs.org/) poller service which can be easily injected into controllers. It uses a timer and sends requests every few seconds to keep the client synced with the server. If you need the data to be exact real-time such as in a chat box, you should use long polling or WebSocket instead.

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

    // Restart poller.
    myPoller.restart();
});
```

## Advanced Usage

### Customization
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

### Multiple Resources
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['poller']);

myModule.controller('myController', function($scope, $resource, poller) {

    // Define resource objects and pollers.
    var resource1 = $resource(...),
        resource2 = $resource(...),
        poller1 = poller.get(resource1),
        poller2 = poller.get(resource2);

    poller1.promise.then(successCallback, errorCallback, notifyCallback);
    poller2.promise.then(successCallback, errorCallback, notifyCallback);

    // Stop all pollers.
    poller.stopAll();

    // Restart all pollers.
    poller.restartAll();

    // Stop and remove all pollers.
    poller.reset();
});
```

### Multiple Controllers
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['poller']);

// Create resource factory.
myModule.factory('myResource', function ($resource) {
    return $resource(...);
});

myModule.controller('controller1', function($scope, poller, myResource) {
    // Register and start poller.
    var myPoller = poller.get(myResource);
    myPoller.promise.then(successCallback, errorCallback, notifyCallback);
});

myModule.controller('controller2', function($scope, poller, myResource) {
    // Get existing poller and restart it.
    var myPoller = poller.get(myResource);
    myPoller.promise.then(successCallback, errorCallback, notifyCallback);
});

myModule.controller('controller3', function($scope, poller, myResource) {
    poller.get(myResource).stop();
});
```