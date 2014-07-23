'use strict';

describe('Poller run block:', function () {

    var $rootScope, poller, spy;

    beforeEach(function () {
        module('emguo.poller');
    });

    it('should stop all pollers on $routeChangeStart if pollerConfig.stopOnRouteChange is true.', function () {
        module(function ($provide) {
            $provide.constant('pollerConfig', {
                stopOnRouteChange: true,
                stopOnStateChange: false
            });
        });

        inject(function (_$rootScope_, _poller_) {
            $rootScope = _$rootScope_;
            poller = _poller_;
        });

        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$routeChangeStart');
        expect(spy).to.have.callCount(1);
    });

    it('should stop all pollers on $stateChangeStart if pollerConfig.stopOnStateChange is true.', function () {
        module(function ($provide) {
            $provide.constant('pollerConfig', {
                stopOnRouteChange: false,
                stopOnStateChange: true
            });
        });

        inject(function (_$rootScope_, _poller_) {
            $rootScope = _$rootScope_;
            poller = _poller_;
        });

        spy = sinon.spy(poller, 'stopAll');
        $rootScope.$broadcast('$stateChangeStart');
        expect(spy).to.have.callCount(1);
    });
});