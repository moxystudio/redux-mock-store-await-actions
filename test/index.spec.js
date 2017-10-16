const waitForActions = require('../');
const configureStore = require('redux-mock-store').default;
const thunkMiddleware = require('redux-thunk').default;

const initialState = {};
const action1 = { type: 'ACTION-1' };
const action2 = { type: 'ACTION-2' };
const action3 = { type: 'ACTION-3' };

const asyncActionsCreator = (actions, timeoutMs = 10) => (dispatch) => {
    const timeout = setTimeout(() => {
        clearTimeout(timeout);
        actions.forEach((action) => dispatch(action));
    }, timeoutMs);
};

const actionsCreator = (actions) => (dispatch) =>
    actions.forEach((action) => dispatch(action));

const createMockStore = (middlewares = []) => configureStore(middlewares)(initialState);

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

it('should fulfill the promise when a single action is dispatched', async () => {
    const mockStore = createMockStore();
    const promise = waitForActions(mockStore, action1);

    mockStore.dispatch(action1);

    await promise;
    expect(mockStore.getActions()).toEqual([action1]);
});

it('should fulfill the promise when action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];
    const promise = waitForActions(mockStore, actions);

    mockStore.dispatch(actionsCreator(actions));
    await promise;
    expect(mockStore.getActions()).toEqual(actions);
});

it('should fulfill the promise when actions are dispatched', () => {
    const mockStore = createMockStore();
    const promise = waitForActions(mockStore, [action1, action2, action3]);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);
    mockStore.dispatch(action3);

    return promise;
});

it('should fulfill the promise when async action creator is dispatched', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];
    const promise = waitForActions(mockStore, actions);

    mockStore.dispatch(asyncActionsCreator(actions));
    await promise;
    expect(mockStore.getActions()).toEqual(actions);
});

it('should reject the promise when no actions are dispatched', async () => {
    const mockStore = createMockStore();
    const actions = [];
    const promise = waitForActions(mockStore, actions);

    let error;

    try {
        await promise;
    } catch (e) {
        error = e;
    }
    expect(error).toBeDefined();
    expect(error).toEqual(new Error('timeout'));
    expect(mockStore.getActions()).toEqual(actions);
});

it('should fulfill the promise when a single action type is expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const promise = waitForActions(mockStore, action1.type);

    mockStore.dispatch(action1);

    return promise;
});

it('should fulfill the promise when action types are expected', () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const actions = [action1, action2, action3];
    const promise = waitForActions(mockStore, actions.map((action) => action.type));

    mockStore.dispatch(actionsCreator(actions));

    return promise;
});

it('should fulfill the promise when predicate is passed and returns true', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const predicate = jest.fn(() => true);
    const promise = waitForActions(mockStore, predicate);

    mockStore.dispatch(action1);

    await promise;
    expect(predicate).toHaveBeenCalledWith([action1]);
});

it('should reject the promise when predicate is passed and returns false', async () => {
    const mockStore = createMockStore([thunkMiddleware]);
    const predicate = jest.fn(() => false);
    const promise = waitForActions(mockStore, predicate);

    mockStore.dispatch(action1);

    let error;

    try {
        await promise;
    } catch (e) {
        error = e;
    }

    expect(predicate).toHaveBeenCalledWith([action1]);
    expect(error).toEqual(new Error('timeout'));
});

it('should reject the promise when the default timeout expires', async () => {
    jest.useFakeTimers();

    const mockStore = createMockStore();
    const actions = [];
    const promise = waitForActions(mockStore, actions);

    jest.runAllTimers();

    let error;

    try {
        await promise;
    } catch (e) {
        error = e;
    }

    expect(error).toEqual(new Error('timeout'));
    expect(mockStore.getActions()).toEqual(actions);
});

it('should return a promise with a teardown function', () => {
    const mockStore = createMockStore();
    const promise = waitForActions(mockStore, action1);

    mockStore.dispatch(action1);

    expect(promise).toHaveProperty('teardown');
    expect(promise.teardown).toBeInstanceOf(Function);

    return promise;
});

it('should fulfill the promise if teardown is called before dispatch of remaining actions', async () => {
    const mockStore = createMockStore();
    const promise = waitForActions(mockStore, [action1, action2, action3]);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);
    promise.teardown();

    await promise;
});

it('should reject the promise if the specified timeout expires', async () => {
    jest.useFakeTimers();

    const mockStore = createMockStore();
    const actions = [];
    const promise = waitForActions(mockStore, actions, 1000);

    jest.runTimersToTime(1000);

    let error;

    try {
        await promise;
    } catch (e) {
        error = e;
    }
    expect(error).toBeDefined();
    expect(error).toEqual(new Error('timeout'));
    expect(mockStore.getActions()).toEqual(actions);
});
