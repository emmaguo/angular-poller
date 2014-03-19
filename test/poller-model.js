'use strict';

describe('Poller model:', function () {

    var $resource, $timeout, $httpBackend, poller, resource1, resource2, poller1, poller2, result1, result2;

    beforeEach(function () {

        module('ngPoller', 'ngResource');

        inject(function (_$resource_, _$timeout_, _$httpBackend_, _poller_) {
            $resource = _$resource_;
            $timeout = _$timeout_;
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
            }
        });
        poller2.promise.then(null, null, function (data) {
            result2 = data;
        });

        $httpBackend.flush();
    });

    afterEach(function () {
        poller.reset();
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

    it('should maintain a copy of resource promise.', function () {
        expect(poller1).to.have.property('promise');
    });

    it('should maintain a timeout ID to manage polling.', function () {
        expect(poller1).to.have.property('timeout').to.have.property('$$timeoutId');
    });

    it('should stop polling and reset timeout ID on invoking stop().', function () {
        poller1.stop();
        expect(poller1.timeout.$$timeoutId).to.equal(null);
    });

    it('should restart currently running poller on invoking restart().', function () {
        var timeoutId = poller1.timeout.$$timeoutId;
        poller1.restart();
        expect(poller1.timeout.$$timeoutId).to.not.equal(timeoutId);
    });

    it('should start already stopped poller on invoking restart().', function () {
        poller1.stop();
        expect(poller1.timeout.$$timeoutId).to.equal(null);
        poller1.restart();
        expect(poller1.timeout.$$timeoutId).to.not.equal(null);
    });

    it('should have correct data in callback.', function () {
        expect(result1.length).to.equal(2);
        expect(result1[1].name).to.equal('Bob');

        expect(result2.id).to.equal(123);
        expect(result2.name).to.equal('Alice');
    });

    it('should fetch resource every (delay) milliseconds.', function () {
        $httpBackend.resetExpectations();
        $httpBackend.expect('GET', '/users').respond([
            {id: 123, name: 'Alice'},
            {id: 456, name: 'Bob'},
            {id: 789, name: 'Lucy'}
        ]);
        $httpBackend.expect('GET', '/user?id=123').respond(
            {id: 123, name: 'Alice', number: '456'}
        );
        $timeout.flush();
        $httpBackend.flush();

        expect(result1.length).to.equal(3);
        expect(result2).to.have.property('number');
    });
});