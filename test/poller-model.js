'use strict';

describe('Poller service', function () {

    describe('Poller model', function () {

        var $resource, $timeout, $httpBackend, poller, resource1, resource2, poller1, poller2;

        beforeEach(function () {
            module('poller');
            module('ngResource');
        });

        beforeEach(inject(function ($injector) {
            $resource = $injector.get('$resource');
            $timeout = $injector.get('$timeout');
            $httpBackend = $injector.get('$httpBackend');
            poller = $injector.get('poller');
        }));

        beforeEach(function () {
            resource1 = $resource('/test1');
            resource2 = $resource('/test2');

            $httpBackend.when('GET', '/test1').respond('Test one success');
            $httpBackend.when('GET', '/test2?say=Hi!').respond('Test two success');

            poller1 = poller.get(resource1);
            poller2 = poller.get(resource2, {
                action: 'get',
                delay: 6000,
                params: {
                    say: 'Hi!'
                }
            });
        });

        afterEach(function () {
            poller.reset();
        });

        it('Should have resource property', function () {
            expect(poller1).to.have.property('resource').to.equal(resource1);
        });

        it('Should have default action property - query', function () {
            expect(poller1).to.have.property('action').to.equal('query');
        });

        it('Should have customized action if it is specified', function () {
            expect(poller2).to.have.property('action').to.equal('get');
        });

        it('Should have default delay property - 5000', function () {
            expect(poller1).to.have.property('delay').to.equal(5000);
        });

        it('Should have customized delay if it is specified', function () {
            expect(poller2).to.have.property('delay').to.equal(6000);
        });

        it('Should have default params property - empty object', function () {
            expect(poller1).to.have.property('params').to.deep.equal({});
        });

        it('Should have customized params if it is specified', function () {
            expect(poller2).to.have.property('params').to.have.property('say').to.equal('Hi!');
        });

        it('Should maintain a copy of resource promise', function () {
            expect(poller1).to.have.property('promise');
        });

        it('Should maintain a timeout ID to manage polling', function () {
            expect(poller1).to.have.property('timeout').to.have.property('$$timeoutId');
        });

        it('Should stop polling and reset timeout ID on invoking stop()', function () {
            poller1.stop();
            expect(poller1.timeout.$$timeoutId).to.equal(null);
        });

        it('Should fetch resource every (delay) milliseconds', function () {
            var firstTimeId = poller1.timeout.$$timeoutId;
            $timeout.flush();
            expect(poller1.timeout.$$timeoutId).to.not.equal(firstTimeId);
        });
    });
});