# Angular Poller
[![Build Status](https://travis-ci.org/emmaguo/angular-poller.svg)](https://travis-ci.org/emmaguo/angular-poller)
[![devDependency Status](https://david-dm.org/emmaguo/angular-poller/dev-status.svg?theme=shields.io)](https://david-dm.org/emmaguo/angular-poller#info=devDependencies)

Lightweight [AngularJS](http://angularjs.org/) poller service which can be easily injected into controllers. It uses a timer and sends requests every few seconds to keep the client synced with the server. If you need the data to be exact real-time such as in a chat box, you should use long polling or WebSocket instead.

Demo site: http://emmaguo.github.io/angular-poller/

## Install

Install with `bower`:

```shell
bower install angular-poller
```

Add a `<script>` to your `index.html`:

```html
<script src="/bower_components/angular-poller/angular-poller.js"></script>
```

## Basic Usage
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['emguo.poller']);

myModule.controller('myController', function($scope, $resource, poller) {

    // Define your resource object.
    var myResource = $resource(url[, paramDefaults]);

    // Get poller. This also starts/restarts poller.
    var myPoller = poller.get(myResource);

    // Update view. Since a promise can only be resolved or rejected once but we want
    // to keep track of all requests, poller service uses the notifyCallback. By default
    // poller only gets notified of success responses.
    myPoller.promise.then(null, null, callback);

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
var myModule = angular.module('myApp', ['emguo.poller']);

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
        },
        // Smart flag is set to false by default. If it is set to true then poller
        // will only send new request after the previous one is resolved.
        smart: true
    });

    myPoller.promise.then(null, null, callback);
});
```

### Error Handling
1. One way to capture error responses is to use the `catchError` option. It indicates whether poller should get notified of error responses.
```javascript
var myPoller = poller.get(myResource, {
    catchError: true
});

myPoller.promise.then(null, null, function (result) {

    // If catchError is set to true, this notifyCallback can contain either
    // a success or an error response.
    if (result.$resolved) {

        // Success handler
        $scope.bla = result.bla;

    } else {

        // Error handler: (data, status, headers, config)
        if (result.status === 503) {
            // Stop poller or provide visual feedback to the user etc
            poller.stopAll();
        }
    }
});
```

2. Alternatively you can use AngularJS `interceptors` for global error handling like so:
```javascript
angular.module('myApp', ['emguo.poller'])
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push(function ($q, poller) {
            return {
                'responseError': function (rejection) {
                    if (rejection.status === 503) {
                        // Stop poller or provide visual feedback to the user etc
                        poller.stopAll();
                    }
                    return $q.reject(rejection);
                }
            };
        });
    });
```

### Multiple Resources
```javascript
// Inject angular poller service.
var myModule = angular.module('myApp', ['emguo.poller']);

myModule.controller('myController', function($scope, $resource, poller) {

    // Define resource objects and pollers.
    var resource1 = $resource(...),
        resource2 = $resource(...),
        poller1 = poller.get(resource1),
        poller2 = poller.get(resource2);

    poller1.promise.then(null, null, callback);
    poller2.promise.then(null, null, callback);

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
var myModule = angular.module('myApp', ['emguo.poller']);

// Create resource factory.
myModule.factory('myResource', function ($resource) {
    return $resource(...);
});

myModule.controller('controller1', function($scope, poller, myResource) {
    // Register and start poller.
    var myPoller = poller.get(myResource);
    myPoller.promise.then(null, null, callback);
});

myModule.controller('controller2', function($scope, poller, myResource) {
    // Get existing poller and restart it.
    var myPoller = poller.get(myResource);
    myPoller.promise.then(null, null, callback);
});

myModule.controller('controller3', function($scope, poller, myResource) {
    poller.get(myResource).stop();
});
```

In order to automatically stop all pollers on navigating between views with multiple controllers, you can use `pollerConfig`.
```javascript
var myModule = angular.module('myApp', ['emguo.poller']);

myModule.config(function (pollerConfig) {
    pollerConfig.stopOnStateChange = true; // If you use $stateProvider from ui-router.
    pollerConfig.stopOnRouteChange = true; // If you use $routeProvider from ngRoute.
});
```