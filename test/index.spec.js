'use strict';

const waitForActions = require('../');
const configureStore = require('redux-mock-store').default;
const thunkMiddleware = require('redux-thunk').default;
const { assertError, spyOnUnsubscribe } = require('./util');

const { containing } = waitForActions.matchers;
const action1 = { type: 'ACTION-1', payload: { id: 1, name: 'ACTION ONE' } };
const action2 = { type: 'ACTION-2', payload: { id: 2, name: 'ACTION TWO' } };
const action3 = { type: 'ACTION-3', payload: { id: 3, name: 'ACTION THREE' } };
const action4 = { type: 'ACTION-4', payload: { id: 4, name: 'ACTION FOUR' } };
const timeoutError = { code: 'ETIMEDOUT', name: 'TimeoutError' };
const cancelledError = { code: 'ECANCELLED', name: 'CancelledError' };
const mismatchError = { code: 'EMISMATCH', name: 'MismatchError' };
const asyncActionsCreator = (actions, timeout = 10) => (dispatch) => {
    setTimeout(() => {
        actions.forEach((action) => dispatch(action));
    }, timeout);
};
const actionsCreator = (actions) => (dispatch) => actions.forEach((action) => dispatch(action));
const createMockStore = (middlewares = []) => configureStore(middlewares)();

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

it('should resolve the promise when a single action is dispatched', async () => {
    const mockStore = createMockStore();

    mockStore.dispatch(action1);
    await waitForActions(mockStore, action1);

    expect(mockStore.getActions()).toEqual([action1]);
});

it('should fulfill the promise when action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(actionsCreator(actions));

    await waitForActions(mockStore, [action1, action2, action3]);

    expect(mockStore.getActions()).toEqual(actions);
});

it('should fulfill the promise when async action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(asyncActionsCreator(actions));

    await waitForActions(mockStore, actions);

    expect(mockStore.getActions()).toEqual(actions);
});

it('should fulfill the promise when no actions are expected', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(asyncActionsCreator(actions));

    await waitForActions(mockStore, []);

    mockStore.clearActions();
    mockStore.dispatch(asyncActionsCreator(actions));

    await waitForActions(mockStore, [], { matcher: containing });
});

it('should reject the promise when an action creator is dispatched and the order of expected and dispatched actions mismatch', () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(actionsCreator(actions));

    const promise = waitForActions(mockStore, [action3, action2, action1]);

    return assertError(promise, mismatchError);
});

it('should reject the promise when an async action creator is dispatched and the order of expected and dispatched actions mismatch', () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(asyncActionsCreator(actions));

    const promise = waitForActions(mockStore, [action3, action1, action2]);

    return assertError(promise, mismatchError);
});

it('should fulfill the promise when expected actions match a subset of property values of dispatched actions', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3, action4];

    mockStore.dispatch(actionsCreator(actions));

    await waitForActions(mockStore, [
        { type: 'ACTION-1', payload: { id: 1 } },
        { type: 'ACTION-2', payload: { name: 'ACTION TWO' } },
        { type: 'ACTION-3' },
        { type: 'ACTION-4', payload: { id: 4, name: 'ACTION FOUR' } },
    ]);
});

it('should reject the promise via timeout when expected actions do not match a subset of property values of dispatched actions',
    () => {
        const mockStore = createMockStore([thunkMiddleware]);
        const actions = [action1, action2];

        mockStore.dispatch(actionsCreator(actions));

        const promise = waitForActions(mockStore, [
            { type: 'ACTION-1', payload: { a: 1 } },
            { type: 'ACTION-3', payload: { name: 'ACTION THREE' } },
        ], { matcher: containing });

        return assertError(promise, timeoutError);
    }
);

it('should reject the promise when expected actions are not received and timeout expires', () => {
    const mockStore = createMockStore();
    const actions = [action1, action2, action3];

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);

    return assertError(waitForActions(mockStore, actions), timeoutError);
});

it('should fulfill the promise when a single action type is expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);

    mockStore.dispatch(action1);

    return waitForActions(mockStore, 'ACTION-1');
});

it('should fulfill the promise when action types are expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);

    mockStore.dispatch(actionsCreator([action1, action2, action3]));

    return waitForActions(mockStore, ['ACTION-1', 'ACTION-2', 'ACTION-3']);
});

it('should fulfill the promise when custom matcher is passed and evaluates to true', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const matcher = jest.fn(() => true);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);

    await waitForActions(mockStore, [], { matcher });

    expect(matcher).toHaveBeenCalledWith([], [action1, action2]);
});

it('should reject the promise via timeout when custom matcher is passed and evaluates to false', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const matcher = jest.fn(() => false);

    mockStore.dispatch(action1);

    await assertError(waitForActions(mockStore, [], { matcher }), timeoutError);

    expect(matcher).toHaveBeenCalledWith([], [action1]);
});

it('should reject the promise when custom matcher throws mismatch error', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const matcher = jest.fn(() => { throw new waitForActions.MismatchError(); });

    mockStore.dispatch(action1);

    await assertError(waitForActions(mockStore, [], { matcher }), mismatchError);

    expect(matcher).toHaveBeenCalledWith([], [action1]);
});

it('should reject the promise when the default timeout expires', () => {
    jest.useFakeTimers();

    const mockStore = createMockStore();

    const promise = waitForActions(mockStore, action1);

    jest.runAllTimers();

    return assertError(promise, timeoutError);
});

it('should return a promise with a cancel function', () => {
    const mockStore = createMockStore();

    const promise = waitForActions(mockStore, action1);

    expect(promise).toHaveProperty('cancel');
    expect(promise.cancel).toBeInstanceOf(Function);

    mockStore.dispatch(action1);

    return promise;
});

it('should reject the promise when cancel() is called before dispatch of remaining actions', () => {
    const mockStore = createMockStore();

    const promise = waitForActions(mockStore, [action1, action2, action3]);

    promise.cancel();

    return assertError(promise, cancelledError);
});

it('should reject the promise when the specified timeout expires', () => {
    jest.useFakeTimers();

    const mockStore = createMockStore();

    const promise = waitForActions(mockStore, action1, { timeout: 1000 });

    jest.runTimersToTime(1000);

    return assertError(promise, timeoutError);
});

it('should fulfill the promise the array of expected actions is contained in the array of dispatched actions', () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(actionsCreator(actions));

    const promise = waitForActions(mockStore, [action3, action2, action1], { matcher: containing });

    return promise;
});

it('should teardown correctly when promise fulfills', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const getUnsubcribeSpy = spyOnUnsubscribe(mockStore);

    mockStore.dispatch(asyncActionsCreator([action1]));

    await waitForActions(mockStore, action1);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
});

it('should teardown correctly when promise rejects via timeout', async () => {
    expect.assertions(1);

    const mockStore = createMockStore([thunkMiddleware]);
    const getUnsubcribeSpy = spyOnUnsubscribe(mockStore);

    mockStore.dispatch(asyncActionsCreator([action1]));

    try {
        await waitForActions(mockStore, [action1, action2]);
    } catch (err) {
        expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
    }
});

it('should teardown correctly when promise rejects via cancelation', async () => {
    expect.assertions(2);

    const mockStore = createMockStore([thunkMiddleware]);
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const getUnsubcribeSpy = spyOnUnsubscribe(mockStore);

    mockStore.dispatch(asyncActionsCreator([action1]));

    const promise = waitForActions(mockStore, [action1, action2]);

    setTimeout(() => promise.cancel(), 10);

    try {
        await promise;
    } catch (err) {
        expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    }
});

it('should teardown correctly when promise rejects with mismatch', async () => {
    expect.assertions(2);

    const mockStore = createMockStore([thunkMiddleware]);
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const getUnsubcribeSpy = spyOnUnsubscribe(mockStore);

    mockStore.dispatch(asyncActionsCreator([action1]));

    try {
        await waitForActions(mockStore, action2);
    } catch (err) {
        expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    }
});
