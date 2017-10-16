const waitForActions = require('../');
const configureStore = require('redux-mock-store').default;
const chai = require('chai');

const middlewares = [];
const initialState = {};
const action1 = { type: 'ACTION-1' };
const action2 = { type: 'ACTION-2' };
const action3 = { type: 'ACTION-3' };
let mockStore = configureStore(middlewares)(initialState);

const asyncActionsCreator = (actions, timeoutMs = 10) => (dispatch) =>
    new Promise((resolve) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            actions.forEach((action) => dispatch(action));
            resolve();
        }, timeoutMs);
    });

const actionsCreator = (actions) => (dispatch) =>
    actions.forEach((action) => dispatch(action));

afterEach(() => {
    mockStore = configureStore(middlewares)(initialState);
    jest.useRealTimers();
    jest.clearAllMocks();
});

it('should fulfill the promise when action is dispatched', async () => {
    const promise = waitForActions(mockStore, action1);

    mockStore.dispatch(action1);

    await promise;
    expect(mockStore.getActions()).toEqual([action1]);
});

it('should fulfill the promise when action creator is dispatched', async () => {
    const actions = [action1, action2, action3];
    const promise = waitForActions(mockStore, actions);

    mockStore.dispatch(actionsCreator(actions));
    await promise;
    expect(mockStore.getActions()).toEqual(actions);
});

it('should fulfill the promise when actions are dispatched', () => {
    const promise = waitForActions(mockStore, [action1, action2, action3]);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);
    mockStore.dispatch(action3);

    return promise;
});

it('should fulfill the promise when async action creator is dispatched', async () => {
    const actions = [action1, action2, action3];
    const promise = waitForActions(mockStore, actions);

    await mockStore.dispatch(asyncActionsCreator(actions));
    await promise;
    expect(mockStore.getActions()).toEqual(actions);
});

it('should reject the promise when no actions are dispatched', async () => {
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

it('should reject the promise when the default timeout expires', async () => {
    jest.useFakeTimers();

    const actions = [];
    const promise = waitForActions(mockStore, actions);

    jest.runAllTimers();

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

it('should return a promise with a teardown function', () => {
    const promise = waitForActions(mockStore, action1);

    mockStore.dispatch(action1);

    expect(promise).toHaveProperty('teardown');
    expect(promise.teardown).toBeInstanceOf(Function);

    return promise;
});

it('it should teardown dispatch on promise completion', async () => {
    const mockDispatch = () => {};

    mockStore.dispatch = mockDispatch;
    const promise = waitForActions(mockStore, action1);

    mockStore.dispatch(action1);

    await promise;
    chai.assert.strictEqual(mockStore.dispatch, mockDispatch);
});

it('should fulfill the promise if teardown is called before dispatch of remaining actions', async () => {
    const promise = waitForActions(mockStore, [action1, action2, action3]);

    mockStore.dispatch(action1);
    mockStore.dispatch(action2);
    promise.teardown();

    await promise;
});

it('should reject the promise if the specified timeout expires', async () => {
    jest.useFakeTimers();

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

it('should call action with dispatch and getState', (done) => {
    waitForActions(mockStore, []);
    const { dispatch: expectDispatch, getState: expectGetState } = mockStore;

    const thunk = () => (dispatch, getState) => {
        expect(dispatch).toBeInstanceOf(Function);
        expect(getState).toBeInstanceOf(Function);
        chai.assert.strictEqual(dispatch, expectDispatch);
        chai.assert.strictEqual(getState, expectGetState);
        done();
    };

    mockStore.dispatch(thunk());
});

it('should call action with custom argument', (done) => {
    const expectedArgument = {
        a: 1,
        b: '2',
        c: true,
        d: () => {},
    };

    waitForActions(mockStore, [], { actionArgument: expectedArgument });

    const thunk = () => (dispatch, getState, customArgument) => {
        expect(customArgument).toMatchObject(expectedArgument);
        done();
    };

    mockStore.dispatch(thunk());
});
