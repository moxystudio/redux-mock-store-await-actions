'use strict';

const isString = require('lodash/isString');
const isSymbol = require('lodash/isSymbol');
const isPlainObject = require('lodash/isPlainObject');
const isEmpty = require('lodash/isEmpty');
const differenceWith = require('lodash/differenceWith');

function isValidAction(value) {
    return isPlainObject(value) && (isString(value.type) || isSymbol(value.type));
}

function isValidActionType(value) {
    return isString(value) || isSymbol(value);
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
            if (isValidAction(value)) {
                return value;
            }
            if (isValidActionType(value)) {
                return { type: value };
            }
            const json = JSON.stringify(value);

            console.warn(`Unexpected action type: ${json}. Not according to flux-standard-action. Only string and symbol are valid`);

            return value;
        });
    }

    const shouldPromiseResolve = typeof actions === 'function' ?
        (storeActions) => actions(storeActions) :
        (storeActions) => isEmpty(differenceWith(actions, storeActions, (action, storeAction) => {
            const json = JSON.stringify(storeAction);

            if (!isValidAction(storeAction)) {
                console.warn(`Action ${json} is not a FSA (flux-standard-action). Action matcher evaluated to false`);

                return false;
            }

            return action.type === storeAction.type;
        }));
    const complete = (timer, callback) => {
        clearTimeout(timer);
        callback();
    };
    // Curry the teardown function to be able to get it from the Promise
    let teardownHolder = (f) => () => f;

    const promise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            complete(timer, () => reject(new Error('timeout')));
        }, timeout);
        const teardown = () => {
            complete(timer, resolve);
        };

        teardownHolder = teardownHolder(teardown);

        store.subscribe(() => {
            if (shouldPromiseResolve(store.getActions())) {
                complete(timeout, resolve);
            }
        });
    });

    promise.teardown = teardownHolder();

    return promise;
};

module.exports = wait;
