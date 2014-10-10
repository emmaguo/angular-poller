'use strict';

describe('Poller model:', function () {

    var $resource, $interval, $httpBackend, poller, target1, target2, poller1, poller2, result1, result2;

    beforeEach(function () {

        module('emguo.poller', 'ngResource');

        inject(function (_$resource_, _$interval_, _$httpBackend_, _poller_) {
            $resource = _$resource_;
            $interval = _$interval_;
            $httpBackend = _$httpBackend_;
            poller = _poller_;
        });

        // Basic poller
        target1 = $resource('/admin');
        $httpBackend.expect('GET', '/admin').respond(
            {id: 1, name: 'Alice'}
        );
        poller1 = poller.get(target1);
        poller1.promise.then(null, null, function (data) {
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
        poller2.promise.then(null, null, function (data) {
            result2 = data;
        });

        $httpBackend.flush(2);
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have target property.', function () {
        expect(poller1).to.have.property('target').to.equal(target1);
        expect(poller2).to.have.property('target').to.equal(target2);
    });

    it('should have default action property - get.', function () {
        expect(poller1).to.have.property('action').to.equal('get');
    });

    it('should have customized action if it is specified.', function () {
        expect(poller2).to.have.property('action').to.equal('query');
    });

    it('should have default delay property - 5000.', function () {
        expect(poller1).to.have.property('delay').to.equal(5000);
    });

    it('should have customized delay if it is specified.', function () {
        expect(poller2).to.have.property('delay').to.equal(6000);
    });

    it('should have default argumentsArray property - empty array.', function () {
        expect(poller1).to.have.property('argumentsArray');
        expect(poller1.argumentsArray.length).to.equal(0);
    });

    it('should have customized argumentsArray if it is specified.', function () {
        expect(poller2.argumentsArray[0]).to.deep.equal({group: 1});
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

    it('should have promise property.', function () {
        expect(poller1).to.have.property('promise');
        expect(poller2).to.have.property('promise');
    });

    it('should have interval property to manage polling.', function () {
        expect(poller1).to.have.property('interval');
        expect(poller2).to.have.property('interval');
    });

    it('should stop polling and reset interval on invoking stop().', function () {
        var current = new Date();
        poller1.stop();
        expect(poller1.interval).to.equal(undefined);
        expect(current - poller1.stopTimestamp).to.be.at.most(1);
    });

    it('should ignore success response if request is sent before stop() is invoked', function () {
        poller2.stop();
        $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});
        $interval.flush(5000); // Request at t = 5000 ms.
        poller1.stop();
        poller1.stopTimestamp = poller1.stopTimestamp + 100; // Poller1 is stopped at t = 5100 ms.
        $httpBackend.flush(1); // Response is ignored because request is sent before poller1 is stopped.

        expect(result1.id).to.equal(1);
        expect(result1.name).to.equal('Alice');
    });

    it('should ignore error response if request is sent before stop() is invoked', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/users?group=1').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(6000); // Request at t = 6000 ms.
        poller2.stop();
        poller2.stopTimestamp = poller2.stopTimestamp + 100; // Poller2 is stopped at t = 6100 ms.
        $httpBackend.flush(1); // Response is ignored because request is sent before poller2 is stopped.

        expect(poller2.catchError).to.equal(true);
        expect(result2.length).to.equal(2);
        expect(result2[0].name).to.equal('Alice');
    });

    it('should restart currently running poller on invoking restart().', function () {
        var intervalId = poller1.interval.$$intervalId;

        $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});
        poller1.restart();
        $httpBackend.flush(1);

        expect(poller1.interval.$$intervalId).to.not.equal(intervalId);
        expect(result1.id).to.equal(2);
        expect(result1.name).to.equal('Bob');
    });

    it('should start already stopped poller on invoking restart().', function () {
        poller1.stop();
        expect(poller1.interval).to.equal(undefined);

        $httpBackend.expect('GET', '/admin').respond({id: 2, name: 'Bob'});
        poller1.restart();
        $httpBackend.flush(1);

        expect(poller1.interval).to.not.equal(undefined);
        expect(result1.id).to.equal(2);
        expect(result1.name).to.equal('Bob');
    });

    it('should have correct data in callback.', function () {
        expect(result1.id).to.equal(1);
        expect(result1.name).to.equal('Alice');

        expect(result2.length).to.equal(2);
        expect(result2[0].name).to.equal('Alice');
    });

    it('should send request every (delay) milliseconds if smart flag is set to false.', function () {
        poller2.stop();
        $httpBackend.expect('GET', '/admin').respond(null);
        $httpBackend.expect('GET', '/admin').respond({id: 3, name: 'Emma'});
        $interval.flush(10100); // 5000 + 5000 + 100
        $httpBackend.flush(2);

        expect(result1.id).to.equal(3);
        expect(result1.name).to.equal('Emma');
    });

    it('should only send new request if the previous one is resolved if smart flag is set to true', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/users?group=1').respond([
            {id: 1, name: 'Alice'},
            {id: 2, name: 'Bob'},
            {id: 3, name: 'Emma'}
        ]);
        $interval.flush(12100); // 6000 + 6000 + 100
        $httpBackend.flush(1);

        expect(result2.length).to.equal(3);
    });

    it('should only get notified of success responses if catchError flag is set to false.', function () {
        var previousResult = result1;
        poller2.stop();
        $httpBackend.expect('GET', '/admin').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(5100); // 5000 + 100
        $httpBackend.flush(1);

        expect(result1).to.equal(previousResult);
    });

    it('should get notified of both success and error responses if catchError flag is set to true.', function () {
        poller1.stop();
        $httpBackend.expect('GET', '/users?group=1').respond(503, 'Service Unavailable', {}, 'Service Unavailable');
        $interval.flush(6100); // 6000 + 100
        $httpBackend.flush(1);

        expect(result2.status).to.equal(503);
        expect(result2.data).to.equal('Service Unavailable');
        expect(result2.statusText).to.equal('Service Unavailable');

        $httpBackend.expect('GET', '/users?group=1').respond([
            {id: 1, name: 'Alice'},
            {id: 2, name: 'Bob'},
            {id: 3, name: 'Emma'}
        ]);
        $interval.flush(6100); // 6000 + 100
        $httpBackend.flush(1);

        expect(result2.length).to.equal(3);
    });
});