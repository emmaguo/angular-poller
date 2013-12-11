'use strict';

describe('Poller service', function () {

    describe('Poller get', function () {

        var $resource, $timeout, $httpBackend, poller, myResource, myPoller, anotherPoller;

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

        describe('Poller is not yet registered', function () {

            beforeEach(function () {
                myResource = $resource('/test');
                $httpBackend.when('GET', '/test').respond('Test success');
                myPoller = poller.get(myResource);
            });

            afterEach(function () {
                poller.reset();
            });

            it('Should create new poller on invoking get() if it is not registered yet', function () {
                expect(myPoller).to.not.equal(null);
            });

            it('Should increase poller registry size by one on registering a new poller', function () {
                expect(poller.size()).to.equal(1);
            });

            it('Should start poller on getting new poller', function () {
                expect(myPoller.timeout.$$timeoutId).not.to.equal(null);
            });
        });

        describe('Poller is already registered', function () {

            beforeEach(function () {
                myResource = $resource('/test');
                $httpBackend.when('GET', '/test').respond('Test success');
                myPoller = poller.get(myResource, {
                    action: 'get',
                    delay: 8000,
                    params: {
                        say: 'Hi!'
                    }
                });
            });

            afterEach(function () {
                poller.reset();
            });

            it('Should not create a new poller on invoking get() if it is already registered', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller).to.equal(myPoller);
            });

            it('Should overwrite poller.action if it is re-defined', function () {
                anotherPoller = poller.get(myResource, {action: 'query'});
                expect(anotherPoller.action).to.equal('query');
            });

            it('Should not modify action property if it is not re-defined', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.action).to.equal('get');
            });

            it('Should overwrite poller.delay if it is re-defined', function () {
                anotherPoller = poller.get(myResource, {delay: 1000});
                expect(anotherPoller.delay).to.equal(1000);
            });

            it('Should not modify delay property if it is not re-defined', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.delay).to.equal(8000);
            });

            it('Should overwrite poller.params if it is re-defined', function () {
                anotherPoller = poller.get(myResource, {params: {say: 'Bye!'}});
                expect(anotherPoller.params.say).to.equal('Bye!');
            });

            it('Should not modify params property if it is not re-defined', function () {
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.params.say).to.equal('Hi!');
            });

            it('Should start polling if it is currently stopped', function () {
                myPoller.stop();
                expect(myPoller.timeout.$$timeoutId).to.equal(null);
                anotherPoller = poller.get(myResource);
                expect(myPoller.timeout.$$timeoutId).to.not.equal(null);
            });

            it('Should restart polling if it is currently running', function () {
                var timeoutId = myPoller.timeout.$$timeoutId;
                anotherPoller = poller.get(myResource);
                expect(anotherPoller.timeout.$$timeoutId).to.not.equal(timeoutId);
            });
        });
    });
});