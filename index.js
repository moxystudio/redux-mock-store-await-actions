'use strict';

const differenceWith = require('lodash/differenceWith');
const isMatch = require('lodash/isMatch');
const isPlainObject = require('lodash/isPlainObject');

function actionsMatch(actions, storeActions) {
    return differenceWith(actions, storeActions, (action, storeAction) => isMatch(storeAction, action)).length === 0;
}

function waitForActions(store, actions, timeout) {
    timeout = timeout || 50;

    if (typeof actions === 'string' || isPlainObject(actions)) {
        actions = [actions];
    }
    if (Array.isArray(actions)) {
        actions = actions.map((value) => typeof value === 'string' ? { type: value } : value);
    }

    const shouldPromiseResolve = typeof actions === 'function' ?
        actions :
        (storeActions) => actionsMatch(actions, storeActions);

    // If the store already contains the expected actions, resolve the Promise immediately
    if (shouldPromiseResolve(store.getActions())) {
        const promise = Promise.resolve();

        promise.cancel = () => {};

        return promise;
    }

    let cancel;

    const promise = new Promise((resolve, reject) => {
        const teardown = () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
        const timeoutId = setTimeout(() => {
            teardown();
            reject(new waitForActions.TimeoutError());
        }, timeout);
        const unsubscribe = store.subscribe(() => {
            if (shouldPromiseResolve(store.getActions())) {
                teardown();
                resolve();
            }
        });

        cancel = () => {
            teardown();
            reject(new waitForActions.CancelledError());
        };
    });

    promise.cancel = cancel;

    return promise;
}

waitForActions.TimeoutError = class extends Error {
    constructor() {
        super('Timeout reached while waiting for actions');
        this.code = 'ETIMEDOUT';
        this.name = 'TimeoutError';
    }
};

waitForActions.CancelledError = class extends Error {
    constructor() {
        super('Cancel was called by user');
        this.code = 'ECANCELLED';
        this.name = 'CancelledError';
    }
};

module.exports = waitForActions;
