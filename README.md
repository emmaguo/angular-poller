# Angular Poller
Need a poller service in your [AngularJS](http://angularjs.org/) application?

## Basic Usage
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['poller']);

myModule.controller('myController', function($scope, poller) {

    // Define your resource object.
    var myResource = $resource(...);

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

myModule.controller('myController', function($scope, poller) {

    // var myResource = $resource(...);

    var myPoller = poller.get(myResource, {
        action: 'get',
        delay: 6000,
        params: {
            verb: 'greet',
            salutation: 'Hello'
        }
    });

    myPoller.promise.then(successCallback, errorCallback, notifyCallback);
});
```