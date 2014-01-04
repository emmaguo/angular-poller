'use strict';

describe('Poller Service:', function () {

    describe('registry:', function () {

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

        it('should return correct number of pollers on invoking size().', function () {
            expect(poller.size()).to.equal(2);
        });

        it('should stop all poller services on invoking stopAll().', function () {
            poller.stopAll();
            expect(poller1.timeout.$$timeoutId).to.equal(null);
            expect(poller2.timeout.$$timeoutId).to.equal(null);
        });

        it('should stop and remove all poller services on invoking reset().', function () {
            poller.reset();
            expect(poller1.timeout.$$timeoutId).to.equal(null);
            expect(poller2.timeout.$$timeoutId).to.equal(null);
            expect(poller.size()).to.equal(0);
        });
    });
});