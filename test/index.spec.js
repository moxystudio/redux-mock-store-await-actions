import waitForActions from '../';
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';
import assertError from './util/assertError';

const initialState = {};
const action1 = { type: 'ACTION-1', payload: { id: 1, name: 'ACTION ONE' } };
const action2 = { type: 'ACTION-2', payload: { id: 2, name: 'ACTION TWO' } };
const action3 = { type: 'ACTION-3', payload: { id: 3, name: 'ACTION THREE' } };
const action4 = { type: 'ACTION-4', payload: { id: 4, name: 'ACTION FOUR' } };
const timeoutError = { code: 'ETIMEDOUT', name: 'TimeoutError' };
const cancelledError = { code: 'ECANCELLED', name: 'CancelledError' };
const asyncActionsCreator = (actions, timeout = 10) => (dispatch) => {
    const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        actions.forEach((action) => dispatch(action));
    }, timeout);
};
const actionsCreator = (actions) => (dispatch) =>
    actions.forEach((action) => dispatch(action));
const createMockStore = (middlewares = []) => configureStore(middlewares)(initialState);

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

it('should resolve the promise when a single action is dispatched', async () => {
    const mockStore = createMockStore();

    mockStore.dispatch(action1);
    await waitForActions(mockStore, action1);

    expect(mockStore.getActions()).toEqual([action1]);
});

it('should resolve the promise when action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(actionsCreator(actions));
    await waitForActions(mockStore, actions);

    expect(mockStore.getActions()).toEqual(actions);
});

it('should resolve the promise when async action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];

    mockStore.dispatch(asyncActionsCreator(actions));
    await waitForActions(mockStore, actions);

    expect(mockStore.getActions()).toEqual(actions);
});

it('should resolve the promise when expected actions match a subset of property values of dispatched actions', async () => {
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
        ]);

        return assertError(promise, timeoutError);
    }
);

it('should resolve the promise when no actions are expected', async () => {
    const mockStore = createMockStore();
    const actions = [];

    await waitForActions(mockStore, actions);

    expect(mockStore.getActions()).toEqual(actions);
});

it('should reject the promise when expected actions are not received and timeout expires', () => {
    const mockStore = createMockStore();
    const actions = [action1, action2, action3];

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);

    return assertError(waitForActions(mockStore, actions), timeoutError);
});

it('should resolve the promise when a single action type is expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);

    mockStore.dispatch(action1);

    return waitForActions(mockStore, 'ACTION-1');
});

it('should fulfill the promise when action types are expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);

    mockStore.dispatch(actionsCreator([action1, action2, action3]));

    return waitForActions(mockStore, ['ACTION-1', 'ACTION-2', 'ACTION-3']);
});

it('should fulfill the promise when predicate is passed and evaluates to true', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const predicate = jest.fn(() => true);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);
    await waitForActions(mockStore, predicate);

    expect(predicate).toHaveBeenCalledWith([action1, action2]);
});

it('should reject the promise via timeout when predicate is passed and always evaluates to false', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const predicate = jest.fn(() => false);

    mockStore.dispatch(action1);

    await assertError(waitForActions(mockStore, predicate), timeoutError);
    expect(predicate).toHaveBeenCalledWith([action1]);
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

it('should reject the promise if cancel() is called before dispatch of remaining actions', () => {
    const mockStore = createMockStore();

    const promise = waitForActions(mockStore, [action1, action2, action3]);

    promise.cancel();

    return assertError(promise, cancelledError);
});

it('should reject the promise if the specified timeout expires', () => {
    jest.useFakeTimers();

    const mockStore = createMockStore();
    const promise = waitForActions(mockStore, action1, 1000);

    jest.runTimersToTime(1000);

    return assertError(promise, timeoutError);
});
