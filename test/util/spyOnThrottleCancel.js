'use strict';

const throttle = require('lodash/throttle');

function spyOnThrottleCancel() {
    let cancelSpy;

    jest.doMock('lodash/throttle', () => (fn, options) => {
        const throttled = throttle(fn, options);

        cancelSpy = jest.spyOn(throttled, 'cancel');

        return throttled;
    });

    return () => cancelSpy;
}

module.exports = spyOnThrottleCancel;
