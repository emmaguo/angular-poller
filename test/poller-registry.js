'use strict';

describe('Poller registry:', function () {

    var $resource, poller, poller1, poller2;

    beforeEach(function () {

        module('poller', 'ngResource');

        inject(function (_$resource_, _poller_) {
            $resource = _$resource_;
            poller = _poller_;
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

    it('should restart all poller services on invoking restartAll().', function () {
        var timeoutId1 = poller1.timeout.$$timeoutId,
            timeoutId2 = poller2.timeout.$$timeoutId;

        poller.restartAll();

        expect(poller1.timeout.$$timeoutId).to.not.equal(timeoutId1);
        expect(poller2.timeout.$$timeoutId).to.not.equal(timeoutId2);
    });

    it('should stop and remove all poller services on invoking reset().', function () {
        poller.reset();
        expect(poller1.timeout.$$timeoutId).to.equal(null);
        expect(poller2.timeout.$$timeoutId).to.equal(null);
        expect(poller.size()).to.equal(0);
    });
});