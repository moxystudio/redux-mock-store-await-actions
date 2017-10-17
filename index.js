'use strict';

const differenceWith = require('lodash/differenceWith');
const isMatch = require('lodash/isMatch');

function isAction(value) {
    return typeof value === 'object' && typeof value.type === 'string';
}

const wait = (store, actions, timeout) => {
    if (!timeout) {
        timeout = 50;
    }

    if (typeof actions !== 'function') {
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        actions = actions.map((value) => {
            if (isAction(value)) {
                return value;
            }
            if (typeof value !== 'string') {
                console.warn(`Action type ${value} is not a string`);
            }

            return { type: value };
        });
    }

    const shouldPromiseResolve = typeof actions === 'function' ?
        (storeActions) => actions(storeActions) :
        (storeActions) => differenceWith(actions, storeActions, (action, storeAction) => isMatch(storeAction, action)).length === 0;

    // If the store already contains the expected actions, resolve the Promise immediately
    if (shouldPromiseResolve(store.getActions())) {
        const promise = Promise.resolve();

        promise.cancel = () => {};

        return promise;
    }

    let cancel = (f) => () => f;

    const promise = new Promise((resolve, reject) => {
        const complete = (promiseResolution) => {
            clearTimeout(timer);
            unsubscribe();
            promiseResolution();
        };
        const unsubscribe = store.subscribe(() => {
            if (shouldPromiseResolve(store.getActions())) {
                complete(resolve);
            }
        });
        const timer = setTimeout(() => {
            complete(() => reject(new Error('timeout')));
        }, timeout);

        cancel = cancel(() => reject(new Error('cancelled')));
    });

    promise.cancel = cancel();

    return promise;
};

module.exports = wait;
