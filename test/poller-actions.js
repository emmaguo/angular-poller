'use strict';

describe('Poller registry:', function () {

    var $resource, poller, poller1, poller2;

    beforeEach(function () {

        module('emguo.poller', 'ngResource');

        inject(function (_$resource_, _poller_) {
            $resource = _$resource_;
            poller = _poller_;
        });

        poller1 = poller.get($resource('/test1'));
        poller2 = poller.get($resource('/test2'));
    });

    it('should return correct number of pollers on invoking size().', function () {
        expect(poller.size()).to.equal(2);
    });

    it('should stop all poller services on invoking stopAll().', function () {
        poller.stopAll();
        expect(poller1.interval).to.equal(undefined);
        expect(poller2.interval).to.equal(undefined);
    });

    it('should restart all poller services on invoking restartAll().', function () {
        var intervalId1 = poller1.interval.$$intervalId,
            intervalId2 = poller2.interval.$$intervalId;

        poller.restartAll();

        expect(poller1.interval.$$intervalId).to.not.equal(intervalId1);
        expect(poller2.interval.$$intervalId).to.not.equal(intervalId2);
    });

    it('should stop and remove all poller services on invoking reset().', function () {
        poller.reset();
        expect(poller1.interval).to.equal(undefined);
        expect(poller2.interval).to.equal(undefined);
        expect(poller.size()).to.equal(0);
    });
});