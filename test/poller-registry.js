'use strict';

describe('Poller Service:', function () {

    describe('registry:', function () {

        var $resource, poller, poller1, poller2;

        beforeEach(function () {

            module('poller');
            module('ngResource');

            inject(function ($injector) {
                $resource = $injector.get('$resource');
                poller = $injector.get('poller');
            });

            poller1 = poller.get($resource('/test1'));
            poller2 = poller.get($resource('/test2'));
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