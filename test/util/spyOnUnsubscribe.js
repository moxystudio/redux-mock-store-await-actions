'use strict';

const wrap = require('lodash/wrap');

function spyOnUnsubscribe(mockStore) {
    let unsubscribeSpy;

    mockStore.subscribe = wrap(mockStore.subscribe, (subscribe, callback) => {
        const unsubscribe = subscribe(callback);

        unsubscribeSpy = jest.fn(() => unsubscribe());

        return unsubscribeSpy;
    });

    return () => unsubscribeSpy;
}

module.exports = spyOnUnsubscribe;
