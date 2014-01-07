'use strict';

describe('Poller Service:', function () {

    describe('get:', function () {

        var $resource, poller, myResource, myPoller, anotherPoller;

        beforeEach(function () {

            module('poller', 'ngResource');

            inject(function (_$resource_, _poller_) {
                $resource = _$resource_;
                poller = _poller_;
            });
        });

        describe('if poller is not registered yet,', function () {

            beforeEach(function () {
                myPoller = poller.get($resource('/test'));
            });

            afterEach(function () {
                poller.reset();
            });

            it('should create new poller on invoking get().', function () {
                expect(myPoller).to.not.equal(null);
            });

            it('should increase poller registry size by one.', function () {
                expect(poller.size()).to.equal(1);
            });

            it('should start poller.', function () {
                expect(myPoller.timeout.$$timeoutId).not.to.equal(null);
            });
        });

        describe('if poller is already registered,', function () {

            beforeEach(function () {
                myResource = $resource('/test');
                myPoller = poller.get(myResource, {
                    action: 'get',
                    delay: 8000,
                    params: {
                        id: '123'
                    }
                });
            });

            afterEach(function () {
                poller.reset();
            });

            it('should not create a new poller on invoking get().', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller).to.equal(myPoller);
            });

            it('should overwrite poller.action if it is re-defined.', function () {
                anotherPoller = poller.get(myResource, {action: 'query'});
                expect(anotherPoller.action).to.equal('query');
            });

            it('should not modify action property if it is not re-defined.', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.action).to.equal('get');
            });

            it('should overwrite poller.delay if it is re-defined.', function () {
                anotherPoller = poller.get(myResource, {delay: 1000});
                expect(anotherPoller.delay).to.equal(1000);
            });

            it('should not modify delay property if it is not re-defined.', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.delay).to.equal(8000);
            });

            it('should overwrite poller.params if it is re-defined.', function () {
                anotherPoller = poller.get(myResource, {params: {id: '456'}});
                expect(anotherPoller.params.id).to.equal('456');
            });

            it('should not modify params property if it is not re-defined.', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.params.id).to.equal('123');
            });

            it('should start polling if it is currently stopped.', function () {
                myPoller.stop();
                expect(myPoller.timeout.$$timeoutId).to.equal(null);
                anotherPoller = poller.get(myResource);
                expect(myPoller.timeout.$$timeoutId).to.not.equal(null);
            });

            it('should restart polling if it is currently running.', function () {
                var timeoutId = myPoller.timeout.$$timeoutId;
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.timeout.$$timeoutId).to.not.equal(timeoutId);
            });
        });
    });
});