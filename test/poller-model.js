'use strict';

describe('Poller model:', function () {

    var $resource, $interval, $httpBackend, poller, resource1, resource2, poller1, poller2, result1, result2;

    beforeEach(function () {

        module('emguo.poller', 'ngResource');

        inject(function (_$resource_, _$interval_, _$httpBackend_, _poller_) {
            $resource = _$resource_;
            $interval = _$interval_;
            $httpBackend = _$httpBackend_;
            poller = _poller_;
        });

        // Basic poller
        resource1 = $resource('/users');
        $httpBackend.expect('GET', '/users').respond([
            {id: 123, name: 'Alice'},
            {id: 456, name: 'Bob'}
        ]);
        poller1 = poller.get(resource1);
        poller1.promise.then(null, null, function (data) {
            result1 = data;
        });

        // Advanced poller
        resource2 = $resource('/user');
        $httpBackend.expect('GET', '/user?id=123').respond(
            {id: 123, name: 'Alice'}
        );
        poller2 = poller.get(resource2, {
            action: 'get',
            delay: 6000,
            params: {
                id: 123
            },
            smart: true,
            catchError: true
        });
        poller2.promise.then(null, null, function (data) {
            result2 = data;
        });

        $httpBackend.flush(2);
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have resource property.', function () {
        expect(poller1).to.have.property('resource').to.equal(resource1);
    });

    it('should have default action property - query.', function () {
        expect(poller1).to.have.property('action').to.equal('query');
    });

    it('should have customized action if it is specified.', function () {
        expect(poller2).to.have.property('action').to.equal('get');
    });

    it('should have default delay property - 5000.', function () {
        expect(poller1).to.have.property('delay').to.equal(5000);
    });

    it('should have customized delay if it is specified.', function () {
        expect(poller2).to.have.property('delay').to.equal(6000);
    });

    it('should have default params property - empty object.', function () {
        expect(poller1).to.have.property('params').to.deep.equal({});
    });

    it('should have customized params if it is specified.', function () {
        expect(poller2).to.have.property('params').to.have.property('id').to.equal(123);
    });

    it('should have default smart flag set to false.', function () {
        expect(poller1).to.have.property('smart').to.equal(false);
    });

    it('should have smart flag set to true if it is specified.', function () {
        expect(poller2).to.have.property('smart').to.equal(true);
    });

    it('should have default catchError flag set to false.', function () {
        expect(poller1).to.have.property('catchError').to.equal(false);
    });

    it('should have catchError flag set to true if it is specified.', function () {
        expect(poller2).to.have.property('catchError').to.equal(true);
    });

    it('should maintain a copy of resource promise.', function () {
        expect(poller1).to.have.property('promise');
    });

    it('should maintain an interval ID to manage polling.', function () {
        expect(poller1).to.have.property('interval').to.have.property('$$intervalId');
    });

    it('should stop polling and reset interval on invoking stop().', function () {
        var current = new Date();
        poller1.stop();
        expect(poller1.interval).to.equal(undefined);
        expect(current - poller1.stopTimestamp).to.be.at.most(1);
    });

    it('should ignore success response if request is sent before stop() is invoked', function () {
        poller2.stop();
        $httpBackend.expect('GET', '/users').respond([]);
        $interval.flush(5000); // Request at t = 5000 ms.
        poller1.stop();
        poller1.stopTimestamp = poller1.stopTimestamp + 100; // Poller1 is stopped at t = 5100 ms.
        $httpBackend.flush(1); // Response is ignored because request is sent before poller1 is stopped.

        expect(result1.length).to.equal(2);
    });

    it('should ignore error response if request is sent before stop() is invoked', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/user?id=123').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(6000); // Request at t = 6000 ms.
        poller2.stop();
        poller2.stopTimestamp = poller2.stopTimestamp + 100; // Poller2 is stopped at t = 6100 ms.
        $httpBackend.flush(1); // Response is ignored because request is sent before poller2 is stopped.

        expect(poller2.catchError).to.equal(true);
        expect(result2.id).to.equal(123);
    });

    it('should restart currently running poller on invoking restart().', function () {
        var intervalId = poller1.interval.$$intervalId;

        $httpBackend.expect('GET', '/users').respond([
            {id: 123, name: 'Alice'},
            {id: 456, name: 'Bob'},
            {id: 789, name: 'John'}
        ]);
        poller1.restart();
        $httpBackend.flush(1);

        expect(poller1.interval.$$intervalId).to.not.equal(intervalId);
        expect(result1.length).to.equal(3);
    });

    it('should start already stopped poller on invoking restart().', function () {
        poller1.stop();
        expect(poller1.interval).to.equal(undefined);

        $httpBackend.expect('GET', '/users').respond([
            {id: 123, name: 'Alice'},
            {id: 456, name: 'Bob'},
            {id: 789, name: 'John'}
        ]);
        poller1.restart();
        $httpBackend.flush(1);

        expect(poller1.interval).to.not.equal(undefined);
        expect(result1.length).to.equal(3);
    });

    it('should have correct data in callback.', function () {
        expect(result1.length).to.equal(2);
        expect(result1[1].name).to.equal('Bob');

        expect(result2.id).to.equal(123);
        expect(result2.name).to.equal('Alice');
    });

    it('should fetch resource every (delay) milliseconds if smart flag is set to false.', function () {
        poller2.stop();
        $httpBackend.expect('GET', '/users').respond([]);
        $httpBackend.expect('GET', '/users').respond([
            {id: 123, name: 'Alice'}
        ]);
        $interval.flush(10100); // 5000 + 5000 + 100
        $httpBackend.flush(2);

        expect(result1.length).to.equal(1);
    });

    it('should only send new request if the previous one is resolved if smart flag is set to true', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/user?id=123').respond(
            {id: 123, name: 'Alice', group: 1}
        );
        $interval.flush(12100); // 6000 + 6000 + 100
        $httpBackend.flush(1);

        expect(result2.group).to.equal(1);
    });

    it('should only get notified of success responses if catchError flag is set to false.', function () {
        var previousResult = result1;
        poller2.stop();
        $httpBackend.expect('GET', '/users').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(5100); // 5000 + 100
        $httpBackend.flush(1);

        expect(result1).to.equal(previousResult);
    });

    it('should get notified of both success and error responses if catchError flag is set to true.', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/user?id=123').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(6100); // 6000 + 100
        $httpBackend.flush(1);

        expect(result2.status).to.equal(503);
        expect(result2.data).to.equal('Service Unavailable');
        expect(result2.statusText).to.equal('Service Unavailable');

        $httpBackend.expect('GET', '/user?id=123').respond({id: 123456, name: 'Alice'});
        $interval.flush(6100); // 6000 + 100
        $httpBackend.flush(1);

        expect(result2.id).to.equal(123456);
    });
});