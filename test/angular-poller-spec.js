'use strict';

describe('emguo.poller', function() {
    var $interval;
    var $httpBackend;
    var $resource;
    var Restangular;
    var poller;

    beforeEach(function() {
        module('emguo.poller', 'ngResource', 'restangular');

        inject(function($injector) {
            $interval = $injector.get('$interval');
            $httpBackend = $injector.get('$httpBackend');
            $resource = $injector.get('$resource');
            Restangular = $injector.get('Restangular');
            poller = $injector.get('poller');
        });
    });

    describe('Model', function() {
        var target1;
        var target2;
        var poller1;
        var poller2;
        var result1;
        var result2;

        beforeEach(function() {
            // Basic poller
            target1 = $resource('/admin');
            $httpBackend.expect('GET', '/admin').respond(
                {id: 1, name: 'Alice'}
            );
            poller1 = poller.get(target1);
            poller1.promise.then(null, null, function(data) {
                result1 = data;
            });

            // Advanced poller
            target2 = $resource('/users');
            $httpBackend.expect('GET', '/users?group=1').respond([
                {id: 1, name: 'Alice'},
                {id: 2, name: 'Bob'}
            ]);
            poller2 = poller.get(target2, {
                action: 'query',
                argumentsArray: [
                    {
                        group: 1
                    }
                ],
                delay: 6000,
                smart: true,
                catchError: true
            });
            poller2.promise.then(null, null, function(data) {
                result2 = data;
            });

            $httpBackend.flush(2);
        });

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should have target property.', function() {
            expect(poller1).to.have.property('target').to.equal(target1);
            expect(poller2).to.have.property('target').to.equal(target2);
        });

        it('should have default action property - get.', function() {
            expect(poller1).to.have.property('action').to.equal('get');
        });

        it('should have customized action if it is specified.', function() {
            expect(poller2).to.have.property('action').to.equal('query');
        });

        it('should have default delay property - 5000.', function() {
            expect(poller1).to.have.property('delay').to.equal(5000);
        });

        it('should have customized delay if it is specified.', function() {
            expect(poller2).to.have.property('delay').to.equal(6000);
        });

        it('should have default argumentsArray property - empty array.', function() {
            expect(poller1).to.have.property('argumentsArray');
            expect(poller1.argumentsArray.length).to.equal(0);
        });

        it('should have customized argumentsArray if it is specified.', function() {
            expect(poller2.argumentsArray[0]).to.deep.equal({group: 1});
        });

        it('should have default smart flag set to false.', function() {
            expect(poller1).to.have.property('smart').to.equal(false);
        });

        it('should have smart flag set to true if it is specified.', function() {
            expect(poller2).to.have.property('smart').to.equal(true);
        });

        it('should have default catchError flag set to false.', function() {
            expect(poller1).to.have.property('catchError').to.equal(false);
        });

        it('should have catchError flag set to true if it is specified.', function() {
            expect(poller2).to.have.property('catchError').to.equal(true);
        });

        it('should have promise property.', function() {
            expect(poller1).to.have.property('promise');
            expect(poller2).to.have.property('promise');
        });

        it('should have interval property to manage polling.', function() {
            expect(poller1).to.have.property('interval');
            expect(poller2).to.have.property('interval');
        });

        it('should stop polling and reset interval on invoking stop().', function() {
            var current = new Date();
            poller1.stop();
            expect(poller1.interval).to.equal(undefined);
            expect(current - poller1.stopTimestamp).to.be.at.most(1);
        });

        it('should ignore success response if request is sent before stop() is invoked', function() {
            poller2.stop();
            $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});

            // Request at t = 5000 ms.
            $interval.flush(5000);
            poller1.stop();

            // Poller1 is stopped at t = 5100 ms.
            poller1.stopTimestamp = poller1.stopTimestamp + 100;
            $httpBackend.flush(1);

            // Response is ignored because request is sent before poller1 is stopped.
            expect(result1.id).to.equal(1);
            expect(result1.name).to.equal('Alice');
        });

        it('should ignore error response if request is sent before stop() is invoked', function() {
            poller1.stop();
            $httpBackend.expect('GET', '/users?group=1').respond(
                503,
                'Service Unavailable',
                {},
                'Service Unavailable'
            );

            // Request at t = 6000 ms.
            $interval.flush(6000);
            poller2.stop();

            // Poller2 is stopped at t = 6100 ms.
            poller2.stopTimestamp = poller2.stopTimestamp + 100;
            $httpBackend.flush(1);

            // Response is ignored because request is sent before poller2 is stopped.
            expect(poller2.catchError).to.equal(true);
            expect(result2.length).to.equal(2);
            expect(result2[0].name).to.equal('Alice');
        });

        it('should stop poller and remove it from poller registry on invoking remove().', function() {
            var spy = sinon.spy(poller1, 'stop');
            expect(poller.size()).to.equal(2);
            poller1.remove();
            expect(spy).to.have.callCount(1);
            expect(poller.size()).to.equal(1);
        });

        it('should restart currently running poller on invoking restart().', function() {
            var intervalId = poller1.interval.$$intervalId;

            $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});
            poller1.restart();
            $httpBackend.flush(1);

            expect(poller1.interval.$$intervalId).to.not.equal(intervalId);
            expect(result1.id).to.equal(2);
            expect(result1.name).to.equal('Bob');
        });

        it('should start already stopped poller on invoking restart().', function() {
            poller1.stop();
            expect(poller1.interval).to.equal(undefined);

            $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});
            poller1.restart();
            $httpBackend.flush(1);

            expect(poller1.interval).to.not.equal(undefined);
            expect(result1.id).to.equal(2);
            expect(result1.name).to.equal('Bob');
        });

        it('should have correct data in callback.', function() {
            expect(result1.id).to.equal(1);
            expect(result1.name).to.equal('Alice');

            expect(result2.length).to.equal(2);
            expect(result2[0].name).to.equal('Alice');
        });

        it('should send request every (delay) milliseconds if smart flag is set to false.', function() {
            poller2.stop();
            $httpBackend.expect('GET', '/admin').respond(null);
            $httpBackend.expect('GET', '/admin').respond({id: 3, name: 'Emma'});

            // 5000 + 5000 + 100
            $interval.flush(10100);
            $httpBackend.flush(2);

            expect(result1.id).to.equal(3);
            expect(result1.name).to.equal('Emma');
        });

        it('should only send new request if the previous one is resolved if smart flag is set to true', function() {
            poller1.stop();
            $httpBackend.expect('GET', '/users?group=1').respond([
                {id: 1, name: 'Alice'},
                {id: 2, name: 'Bob'},
                {id: 3, name: 'Emma'}
            ]);

            // 6000 + 6000 + 100
            $interval.flush(12100);
            $httpBackend.flush(1);

            expect(result2.length).to.equal(3);
        });

        it('should only get notified of success responses if catchError flag is set to false.', function() {
            var previousResult = result1;
            poller2.stop();
            $httpBackend.expect('GET', '/admin').respond(
                503,
                'Service Unavailable',
                {},
                'Service Unavailable'
            );

            // 5000 + 100
            $interval.flush(5100);
            $httpBackend.flush(1);

            expect(result1).to.equal(previousResult);
        });

        it('should get notified of both success and error responses if catchError flag is set to true.', function() {
            poller1.stop();
            $httpBackend.expect('GET', '/users?group=1').respond(
                503,
                'Service Unavailable',
                {},
                'Service Unavailable'
            );

            // 6000 + 100
            $interval.flush(6100);
            $httpBackend.flush(1);

            expect(result2.status).to.equal(503);
            expect(result2.data).to.equal('Service Unavailable');

            $httpBackend.expect('GET', '/users?group=1').respond([
                {id: 1, name: 'Alice'},
                {id: 2, name: 'Bob'},
                {id: 3, name: 'Emma'}
            ]);

            // 6000 + 100
            $interval.flush(6100);
            $httpBackend.flush(1);

            expect(result2.length).to.equal(3);
        });
    });

    describe('$resource', function() {

        it('should make GET requests correctly.', function() {
            poller.get($resource('/admin'), {
                argumentsArray: [
                    {
                        test1: 1,
                        test2: 2
                    }
                ]
            });

            $httpBackend.expect('GET', '/admin?test1=1&test2=2').respond({});
            $httpBackend.flush(1);
        });

        it('should make non-GET requests correctly.', function() {
            poller.get($resource('/admin'), {
                action: 'save',
                argumentsArray: [
                    {
                        param1: 1,
                        param2: 2
                    },
                    {
                        data1: 1
                    }
                ]
            });

            $httpBackend.expect('POST', '/admin?param1=1&param2=2', '{"data1":1}').respond({});
            $httpBackend.flush(1);
        });
    });

    describe('Restangular', function() {

        it('should call element methods correctly.', function() {
            poller.get(Restangular.one('admin', 123), {
                action: 'get',
                argumentsArray: [
                    {
                        param1: 1,
                        param2: 2
                    },
                    {
                        header1: 1
                    }
                ]
            });

            $httpBackend.expect('GET', '/admin/123?param1=1&param2=2', undefined, function(headers) {
                return headers.header1 === 1;
            }).respond([]);
            $httpBackend.flush(1);
        });

        it('should call collection methods correctly.', function() {
            poller.get(Restangular.all('users'), {
                action: 'getList',
                argumentsArray: [
                    {
                        param1: 1,
                        param2: 2
                    },
                    {
                        header1: 1
                    }
                ]
            });

            $httpBackend.expect('GET', '/users?param1=1&param2=2', undefined, function(headers) {
                return headers.header1 === 1;
            }).respond([]);
            $httpBackend.flush(1);
        });

        it('should call custom methods correctly.', function() {
            poller.get(Restangular.one('admin', 123), {
                action: 'customGET',
                argumentsArray: [
                    'test',
                    {
                        param1: 1,
                        param2: 2
                    },
                    {
                        header1: 1
                    }
                ]
            });

            $httpBackend.expect('GET', '/admin/123/test?param1=1&param2=2', undefined, function(headers) {
                return headers.header1 === 1;
            }).respond([]);
            $httpBackend.flush(1);
        });
    });

    describe('$http', function() {

        it('should make GET requests correctly.', function() {
            poller.get('/admin', {
                argumentsArray: [
                    {
                        params: {
                            param1: 1,
                            param2: 2
                        },
                        headers: {
                            header1: 1
                        }
                    }
                ]
            });

            $httpBackend.expect('GET', '/admin?param1=1&param2=2', undefined, function(headers) {
                return headers.header1 === 1;
            }).respond({});
            $httpBackend.flush(1);
        });

        it('should make POST requests correctly.', function() {
            poller.get('/admin', {
                action: 'post',
                argumentsArray: [
                    {
                        data1: 1
                    },
                    {
                        params: {
                            param1: 1,
                            param2: 2
                        },
                        headers: {
                            header1: 1
                        }
                    }
                ]
            });

            $httpBackend.expect('POST', '/admin?param1=1&param2=2', '{"data1":1}', function(headers) {
                return headers.header1 === 1;
            }).respond({});
            $httpBackend.flush(1);
        });
    });

    describe('Get', function() {
        var target;
        var myPoller;
        var anotherPoller;

        describe('if poller is not registered yet,', function() {

            beforeEach(function() {
                myPoller = poller.get($resource('/users'));
            });

            it('should create new poller on invoking get().', function() {
                expect(myPoller).to.not.equal(null);
            });

            it('should increase poller registry size by one.', function() {
                expect(poller.size()).to.equal(1);
            });

            it('should start poller.', function() {
                expect(myPoller.interval.$$intervalId).not.to.equal(null);
            });
        });

        describe('if poller is already registered,', function() {

            beforeEach(function() {
                target = $resource('/users');
                myPoller = poller.get(target, {
                    action: 'query',
                    argumentsArray: [
                        {
                            group: 1
                        }
                    ],
                    delay: 8000
                });
            });

            it('should not create a new poller on invoking get().', function() {
                anotherPoller = poller.get(target);
                expect(anotherPoller).to.equal(myPoller);
            });

            it('should overwrite poller.action if it is re-defined.', function() {
                anotherPoller = poller.get(target, {action: 'get'});
                expect(anotherPoller.action).to.equal('get');
            });

            it('should not modify action property if it is not re-defined.', function() {
                anotherPoller = poller.get(target);
                expect(anotherPoller.action).to.equal('query');
            });

            it('should overwrite poller.delay if it is re-defined.', function() {
                anotherPoller = poller.get(target, {delay: 1000});
                expect(anotherPoller.delay).to.equal(1000);
            });

            it('should always set (and overwrite) normalDelay same as delay.', function() {
                anotherPoller = poller.get(target, {delay: 1000});
                expect(anotherPoller.normalDelay).to.exist();
                expect(anotherPoller.normalDelay).to.equal(anotherPoller.delay);

                poller.get(target, {delay: 3000});
                expect(anotherPoller.normalDelay).to.exist();
                expect(anotherPoller.normalDelay).to.equal(anotherPoller.delay);
            });

            it('should not modify delay property if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.delay).to.equal(8000);
            });

            it('should overwrite poller.argumentsArray if it is re-defined.', function() {
                anotherPoller = poller.get(target, {argumentsArray: []});
                expect(anotherPoller.argumentsArray.length).to.equal(0);
            });

            it('should not modify argumentsArray property if it is not re-defined.', function() {
                anotherPoller = poller.get(target);
                expect(anotherPoller.argumentsArray[0]).to.deep.equal({group: 1});
            });

            it('should overwrite poller.smart if it is re-defined.', function() {
                anotherPoller = poller.get(target, {smart: true});
                expect(anotherPoller.smart).to.equal(true);
            });

            it('should not modify smart flag if it is not re-defined.', function() {
                anotherPoller = poller.get(target);
                expect(anotherPoller.smart).to.equal(false);
            });

            it('should overwrite poller.catchError if it is re-defined.', function() {
                anotherPoller = poller.get(target, {catchError: true});
                expect(anotherPoller.catchError).to.equal(true);
            });

            it('should not modify catchError flag if it is not re-defined.', function() {
                anotherPoller = poller.get(target);
                expect(anotherPoller.catchError).to.equal(false);
            });

            it('should start polling if it is currently stopped.', function() {
                myPoller.stop();
                expect(myPoller.interval).to.equal(undefined);
                anotherPoller = poller.get(target);
                expect(myPoller.interval.$$intervalId).to.not.equal(null);
            });

            it('should restart polling if it is currently running.', function() {
                var intervalId = myPoller.interval.$$intervalId;
                anotherPoller = poller.get(target);
                expect(anotherPoller.interval.$$intervalId).to.not.equal(intervalId);
            });
        });
    });

    describe('Actions', function() {
        var poller1;
        var poller2;

        beforeEach(function() {
            poller1 = poller.get($resource('/test1'));
            poller2 = poller.get($resource('/test2'));
        });

        it('should return correct number of pollers on invoking size().', function() {
            expect(poller.size()).to.equal(2);
        });

        it('should stop all poller services on invoking stopAll().', function() {
            poller.stopAll();
            expect(poller1.interval).to.equal(undefined);
            expect(poller2.interval).to.equal(undefined);
        });

        it('should restart all poller services on invoking restartAll().', function() {
            var intervalId1 = poller1.interval.$$intervalId;
            var intervalId2 = poller2.interval.$$intervalId;

            poller.restartAll();

            expect(poller1.interval.$$intervalId).to.not.equal(intervalId1);
            expect(poller2.interval.$$intervalId).to.not.equal(intervalId2);
        });

        it('should stop and remove all poller services on invoking reset().', function() {
            poller.reset();
            expect(poller1.interval).to.equal(undefined);
            expect(poller2.interval).to.equal(undefined);
            expect(poller.size()).to.equal(0);
        });
    });
});

describe('emguo.poller PollerConfig', function() {
    var $rootScope;
    var $resource;
    var poller;
    var spy;
    var anotherSpy;

    beforeEach(function() {
        module('emguo.poller', 'ngResource');
    });

    function instantiate() {
        inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $resource = $injector.get('$resource');
            poller = $injector.get('poller');
        });
    }

    it('should not listen to invalid events', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                stopOn: 'randomEvent',
                resetOn: 'randomEvent'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'stopAll');
        anotherSpy = sinon.spy(poller, 'reset');
        $rootScope.$broadcast('randomEvent');

        expect(spy).to.have.callCount(0);
        expect(anotherSpy).to.have.callCount(0);
    });

    it('should stop all pollers on $routeChangeStart if pollerConfig.stopOn is set to $routeChangeStart.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                stopOn: '$routeChangeStart'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$routeChangeStart');

        expect(spy).to.have.callCount(1);
    });

    it('should stop all pollers on $routeChangeSuccess if pollerConfig.stopOn is set to $routeChangeSuccess.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                stopOn: '$routeChangeSuccess'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$routeChangeSuccess');

        expect(spy).to.have.callCount(1);
    });

    it('should stop all pollers on $stateChangeStart if pollerConfig.stopOn is set to $stateChangeStart.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                stopOn: '$stateChangeStart'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$stateChangeStart');

        expect(spy).to.have.callCount(1);
    });

    it('should stop all pollers on $stateChangeSuccess if pollerConfig.stopOn is set to $stateChangeSuccess.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                stopOn: '$stateChangeSuccess'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(spy).to.have.callCount(1);
    });

    it('should reset all pollers on $routeChangeStart if pollerConfig.resetOn is set to $routeChangeStart.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                resetOn: '$routeChangeStart'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'reset');
        $rootScope.$broadcast('$routeChangeStart');

        expect(spy).to.have.callCount(1);
    });

    it('should reset all pollers on $routeChangeSuccess if pollerConfig.resetOn is set to $routeChangeSuccess.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                resetOn: '$routeChangeSuccess'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'reset');
        $rootScope.$broadcast('$routeChangeSuccess');

        expect(spy).to.have.callCount(1);
    });

    it('should reset all pollers on $stateChangeStart if pollerConfig.resetOn is set to $stateChangeStart.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                resetOn: '$stateChangeStart'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'reset');
        $rootScope.$broadcast('$stateChangeStart');

        expect(spy).to.have.callCount(1);
    });

    it('should reset all pollers on $stateChangeSuccess if pollerConfig.resetOn is set to $stateChangeSuccess.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                resetOn: '$stateChangeSuccess'
            });
        });
        instantiate();
        spy = sinon.spy(poller, 'reset');
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(spy).to.have.callCount(1);
    });

    it('should always create new poller if pollerConfig.neverOverwrite is true.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                neverOverwrite: true
            });
        });
        instantiate();
        var target = $resource('/users');
        var myPoller = poller.get(target, {
            action: 'query',
            argumentsArray: [
                {
                    group: 1
                }
            ],
            delay: 8000
        });
        var anotherPoller = poller.get(target);

        expect(anotherPoller).to.not.equal(myPoller);
        expect(anotherPoller.action).to.equal('get');
        expect(anotherPoller.argumentsArray.length).to.equal(0);
        expect(anotherPoller.delay).to.equal(5000);
    });

    it('should set all pollers smart if pollerConfig.smart is true.', function() {
        module(function($provide) {
            $provide.constant('pollerConfig', {
                smart: true
            });
        });
        instantiate();

        expect(poller.get('/test1').smart).to.equal(true);
        expect(poller.get('/test2').smart).to.equal(true);
    });

    it('should switch delay of all pollers that have idleDelay on visibilitychange.', function () {
        module(function ($provide) {
            $provide.constant('pollerConfig', {
                delayOnVisibilityChange: true
            });
        });

        inject(function (_$resource_, _poller_) {
            $resource = _$resource_;
            poller = _poller_;
        });

        var target = $resource('/users');
        var myPoller = poller.get(target, {
            delay: 5000,
            idleDelay: 10000
        });

        poller.delayAll();
        expect(myPoller.delay).to.equal(myPoller.idleDelay);

        poller.resetDelay();
        expect(myPoller.delay).to.equal(myPoller.normalDelay);
    });
});
