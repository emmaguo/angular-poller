'use strict';

describe('Poller registry:', function () {

    describe('get:', function () {

        var $resource, poller, target, myPoller, anotherPoller;

        beforeEach(function () {

            module('emguo.poller', 'ngResource');

            inject(function (_$resource_, _poller_) {
                $resource = _$resource_;
                poller = _poller_;
            });
        });

        describe('if poller is not registered yet,', function () {

            beforeEach(function () {
                myPoller = poller.get($resource('/users'));
            });

            it('should create new poller on invoking get().', function () {
                expect(myPoller).to.not.equal(null);
            });

            it('should increase poller registry size by one.', function () {
                expect(poller.size()).to.equal(1);
            });

            it('should start poller.', function () {
                expect(myPoller.interval.$$intervalId).not.to.equal(null);
            });
        });

        describe('if poller is already registered,', function () {

            beforeEach(function () {
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

            it('should not create a new poller on invoking get().', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller).to.equal(myPoller);
            });

            it('should overwrite poller.action if it is re-defined.', function () {
                anotherPoller = poller.get(target, {action: 'get'});
                expect(anotherPoller.action).to.equal('get');
            });

            it('should not modify action property if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.action).to.equal('query');
            });

            it('should overwrite poller.delay if it is re-defined.', function () {
                anotherPoller = poller.get(target, {delay: 1000});
                expect(anotherPoller.delay).to.equal(1000);
            });

            it('should not modify delay property if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.delay).to.equal(8000);
            });

            it('should overwrite poller.argumentsArray if it is re-defined.', function () {
                anotherPoller = poller.get(target, {argumentsArray: []});
                expect(anotherPoller.argumentsArray.length).to.equal(0);
            });

            it('should not modify argumentsArray property if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.argumentsArray[0]).to.deep.equal({group: 1});
            });

            it('should overwrite poller.smart if it is re-defined.', function () {
                anotherPoller = poller.get(target, {smart: true});
                expect(anotherPoller.smart).to.equal(true);
            });

            it('should not modify smart flag if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.smart).to.equal(false);
            });

            it('should overwrite poller.catchError if it is re-defined.', function () {
                anotherPoller = poller.get(target, {catchError: true});
                expect(anotherPoller.catchError).to.equal(true);
            });

            it('should not modify catchError flag if it is not re-defined.', function () {
                anotherPoller = poller.get(target);
                expect(anotherPoller.catchError).to.equal(false);
            });

            it('should start polling if it is currently stopped.', function () {
                myPoller.stop();
                expect(myPoller.interval).to.equal(undefined);
                anotherPoller = poller.get(target);
                expect(myPoller.interval.$$intervalId).to.not.equal(null);
            });

            it('should restart polling if it is currently running.', function () {
                var intervalId = myPoller.interval.$$intervalId;
                anotherPoller = poller.get(target);
                expect(anotherPoller.interval.$$intervalId).to.not.equal(intervalId);
            });
        });
    });
});