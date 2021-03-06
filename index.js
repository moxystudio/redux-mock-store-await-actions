'use strict';

const differenceWith = require('lodash/differenceWith');
const isEqualWith = require('lodash/isEqualWith');
const isMatch = require('lodash/isMatch');
const isPlainObject = require('lodash/isPlainObject');
const throttle = require('lodash/throttle');

function actionsContaining(expectedActions, storeActions) {
    return differenceWith(expectedActions, storeActions, (expectedAction, storeAction) => isMatch(storeAction, expectedAction)).length === 0;
}

function actionsMatchOrder(expectedActions, storeActions) {
    const isEqual = isEqualWith(expectedActions, storeActions, (expectedAction, storeAction) => isMatch(storeAction, expectedAction));

    if (!isEqual && storeActions.length >= expectedActions.length) {
        throw new MismatchError();
    }

    return isEqual;
}

function settledPromise(matcher, expectedActions, storeActions) {
    try {
        if (matcher(expectedActions, storeActions)) {
            return Promise.resolve();
        }
    } catch (err) {
        if (err instanceof MismatchError) {
            return Promise.reject(err);
        }
    }
}

module.exports = (store, expectedActions, options) => {
    const { timeout, matcher, throttleWait } = {
        timeout: 2000,
        matcher: actionsMatchOrder,
        throttleWait: 0,
        ...options,
    };

    if (typeof expectedActions === 'string' || isPlainObject(expectedActions)) {
        expectedActions = [expectedActions];
    }
    if (Array.isArray(expectedActions)) {
        expectedActions = expectedActions.map((value) => typeof value === 'string' ? { type: value } : value);
    }

    const matchPromise = settledPromise.bind(null, matcher, expectedActions);

    let promise = matchPromise(store.getActions());

    if (promise) {
        promise.cancel = () => {};

        return promise;
    }

    let cancel;

    promise = new Promise((resolve, reject) => {
        const maybeThrottled = (() => {
            const runMatcher = (storeActions) => {
                const promise = matchPromise(storeActions);

                if (promise) {
                    teardown();
                    resolve(promise);
                }
            };

            if (throttleWait > 0) {
                return throttle(runMatcher, throttleWait, { leading: false, trailing: true });
            }

            runMatcher.cancel = () => {};

            return runMatcher;
        })();
        const teardown = () => {
            maybeThrottled.cancel();
            clearTimeout(timeoutId);
            unsubscribe();
        };
        const timeoutId = setTimeout(() => {
            teardown();
            reject(new TimeoutError());
        }, timeout);
        const unsubscribe = store.subscribe(() => maybeThrottled(store.getActions()));

        cancel = () => {
            teardown();
            reject(new CancelledError());
        };
    });

    promise.cancel = cancel;

    return promise;
};

class TimeoutError extends Error {
    constructor() {
        super('Timeout reached while waiting for actions');
        this.code = 'ETIMEDOUT';
        this.name = 'TimeoutError';
    }
}

class CancelledError extends Error {
    constructor() {
        super('Cancel was called by user');
        this.code = 'ECANCELLED';
        this.name = 'CancelledError';
    }
}

class MismatchError extends Error {
    constructor() {
        super('Found mismatch between the order of the array of expected and dispatched actions');
        this.code = 'EMISMATCH';
        this.name = 'MismatchError';
    }
}

module.exports.MismatchError = MismatchError;
module.exports.matchers = { containing: actionsContaining, order: actionsMatchOrder };
