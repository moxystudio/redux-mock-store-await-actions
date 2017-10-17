# redux-mock-store-await-actions

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] [![Greenkeeper badge][greenkeeper-image]][greenkeeper-url] ![Conventional Commits][conventional-commits-url]

[npm-url]:https://npmjs.org/package/redux-mock-store-await-actions
[npm-image]:http://img.shields.io/npm/v/redux-mock-store-await-actions.svg
[downloads-image]:http://img.shields.io/npm/dm/redux-mock-store-await-actions.svg
[travis-url]:https://travis-ci.org/moxystudio/redux-mock-store-await-actions
[travis-image]:http://img.shields.io/travis/moxystudio/redux-mock-store-await-actions/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/redux-mock-store-await-actions
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/redux-mock-store-await-actions/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/redux-mock-store-await-actions
[david-dm-image]:https://img.shields.io/david/moxystudio/redux-mock-store-await-actions.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/redux-mock-store-await-actions?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/redux-mock-store-await-actions.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/redux-mock-store-await-actions.svg
[greenkeeper-url]:https://greenkeeper.io
[conventional-commits-url]:https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg

> Waits for actions dispatched asynchronously until a timeout expires.

**NOTE:** This module only works with [redux-mock-store](https://github.com/arnaudbenard/redux-mock-store) and shall only be used for testing purposes. Support for real Redux store is not provided.

## Installation

`$ npm install redux-mock-store-await-actions --save-dev`

## Motivation

Consider the following example:

```js
function login(username, password) {
    return async (dispatch) => {
        dispatch({ type: 'LOGIN_START', payload: { username, password } });

        try {
            const user = await fetch('/login', {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (err) {
            dispatch({ type: 'LOGIN_FAIL', payload: err });
            throw err;
        }

        // Fetch orders asynchronously, not waiting for them to be retrieved
        dispatch(fetchOrders());
    }
}

function fetchOrders() {
    return async (dispatch) => {
        dispatch({ type: 'FETCH_ORDERS_START' });

        try {
            const orders = await fetch('/account/orders');

            dispatch({ type: 'FETCH_ORDERS_SUCCESS', payload: orders });
        } catch (err) {
            dispatch({ type: 'FETCH_ORDERS_FAIL', payload: err });
            throw err;
        }
    }
}

store.dispatch(login('my-username', '12345'));

expect(store.getActions()).toContain([
    'LOGIN_START',
    'FETCH_ORDERS_SUCCESS'
]);
```

The assertion above will fail because `FETCH_ORDERS_SUCCESS` will not yet exist in the stack of actions.
To solve this, one can use `setTimeout` explicitly in each test:

```js
store.dispatch(login('my-username', '12345'));

setTimeout(() => expect(store.getActions()).toContain([
    'LOGIN_START',
    'FETCH_ORDERS_SUCCESS'
]), 50);
```

However, this is not pretty and is error-prone. `redux-mock-store-await-actions` makes this easier for you.

## Usage

### Example #1: action types

Supply the action types to await for.

```js
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();

store.dispatch(login('my-username', '12345'));
await waitForActions(store, ['LOGIN_START', 'FETCH_ORDERS_SUCCESS']);
```

### Example #2: action objects

Supply the action objects to await for. Matches a subset of the properties of the dispatched actions.

```js
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();

store.dispatch(login('my-username', '123'));
await waitForActions(store, [
    {
        type: 'LOGIN_START',
        payload: { username: 'my-username' },
    },
    {
        type: 'FETCH_ORDERS_SUCCESS',
    },
]);
```

### Example #3: function (advanced use cases)

Supply a predicate which will be called for every action dispatched.

```js
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();

store.dispatch(login('my-username', '123'));
await waitForActions(store, (storeActions) => {
	const hasLoginStart = storeActions.some((item) => item.type === 'LOGIN_START' && item.payload.username === 'my-username');
    const hasFetchOrdersSuccess = storeActions.some((item) => item.type === 'FETCH_ORDERS_SUCCESS');

    return hasLoginStart && hasFetchOrdersSuccess;
});
```

**NOTE:** Subsequent calls to `waitForActions` should be preceded by a call to `store.clearActions()`, otherwise the returned `Promise` will resolve immediately.

## API

### waitForActions(store, actions, [timeout])

Returns a `Promise` which fulfils if all `actions` are dispatched before the timeout expires, otherwise it is rejected. The `Promise` has a `.cancel()` function which, if called, will reject the `Promise`.

When the `Promise` is rejected:

* as a result of timer expiration, an `Error` is thrown with the message 'timeout'
* as a result of `.cancel()` invocation, an `Error` is thrown with the message 'cancelled'

#### store

Type: `Object`

The Redux store.

#### actions

Type: `Object` `String` `Array` `Function`

The actions to wait for. It can be either:

* `String`: an action type string.
* `Object`: an action object
* `Array`: an array of action objects or an array of action type strings.
* `Function`: a predicate which receives the array of returned by `store.getActions()` of `redux-mock-store`.

#### timeout

Type: `Number`<br>
Default: 50

The timeout given in milliseconds.

## Tests

`$ npm test`
`$ npm test:watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
