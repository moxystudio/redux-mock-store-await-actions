# redux-wait-actions

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


## Installation

`$ npm install redux-mock-store-await-actions --save-dev`


## Motivation

When `asyncActionCreator` dispatches various actions asynchronously, the following test will fail:

```js
store.dispatch(asyncActionCreator());
expect(store.getActions()).toEqual(expect.arrayContaining(expectedActions));
```

To solve this, one can use `setTimeout` explicitly in each test:

```js
store.dispatch(asyncActionCreator());
setTimeout(() => {
	expect(store.getActions()).toEqual(expect.arrayContaining(expectedActions));
}, 50);
```

To get around this ugliness, `redux-mock-store-await-actions` sets the timeout for you and returns a `Promise` to await for dispatch of specified actions and handle timeout.

## Usage

**NOTE:** This module only works with [redux-mock-store](https://github.com/arnaudbenard/redux-mock-store) and shall only be used for testing purposes. Support for real redux store is not provided. 

### Example #1: action types

```js
const promise = awaitForActions(store, ['action-1', action-2', ...]);
// dispatch actions
await promise;
```

### Example #2: thunk

```js
const action1 = { type: 'action1', payload: {...} };
const action2 = { type: 'action2', payload: {...} };
const thunk = () => (dispatch, getState) => {
	const timer = setTimeout(() => {
		clearTimeout(timer);
		dispatch(action1);
		dispatch(action2);
	}, 50);
};
const promise = awaitForActions(store, [action1, action2, ...]);
store.dispatch(thunk());
await promise;
```

### Example #3: function

```js
const predicate = (storeActions) => {
	// custom logic
};
const promise = awaitForActions(store, predicate);
// dispatch actions
await promise;
```

## API

### waitForActions(store, actions, [timeout])

Returns a `Promise` which fulfills if all `actions` are dispatched before the timeout expires, otherwise it is rejected.

#### store

Type: `Object`

The Redux store.

#### actions

Type: `Object` `String` `Array` `Function`

The actions to wait for. It can be either:

* `Object`: an action with `type` property defined.
	* **NOTE:** The action's `payload` is not evaluated when performing the match with expected actions, only its `type` is.
* `String`: an action type string.
* `Array`: an array of action objects or an array of action type strings.
* `Function`: a predicate which accepts an array of the action objects received by `redux-mock-store`.

#### timeout

Type: `Number`<br>
Default: 50

The timeout given in milliseconds.

## Tests

`$ npm test`   
`$ npm test:watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
