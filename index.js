'use strict';

const wait = (store, actions, options) => {
    options = Object.assign({
        timeoutMs: 50,
        actionArgument: undefined,
    }, options);

    if (!Array.isArray(actions)) {
        actions = [actions];
    }

    const originalDispatch = store.dispatch;
    const unhookDispatch = () => {
        store.dispatch = originalDispatch;
    };
    const complete = (timeout, callback) => {
        clearTimeout(timeout);
        unhookDispatch();
        callback();
    };
    let teardownHolder = (f) => () => f;

    const promise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            complete(timeout, () => reject(new Error('timeout')));
        }, options.timeoutMs);
        const teardown = () => {
            complete(timeout, resolve);
        };

        teardownHolder = teardownHolder(teardown);

        store.dispatch = (interceptedAction) => {
            if (typeof interceptedAction !== 'function') {
                actions = actions.filter((action) => action.type !== interceptedAction.type);
                const action = originalDispatch.call(store, interceptedAction);

                if (actions.length === 0) {
                    complete(timeout, resolve);
                }

                return action;
            }

            return interceptedAction(store.dispatch, store.getState, options.actionArgument);
        };
    });

    promise.teardown = teardownHolder();

    return promise;
};

module.exports = wait;
