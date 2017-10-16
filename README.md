# redux-wait-actions

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] [![Greenkeeper badge][greenkeeper-image]][greenkeeper-url] ![Conventional Commits][conventional-commits-url]

[npm-url]:https://npmjs.org/package/redux-wait-actions
[npm-image]:http://img.shields.io/npm/v/redux-wait-actions.svg
[downloads-image]:http://img.shields.io/npm/dm/redux-wait-actions.svg
[travis-url]:https://travis-ci.org/moxystudio/redux-wait-actions
[travis-image]:http://img.shields.io/travis/moxystudio/redux-wait-actions/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/redux-wait-actions
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/redux-wait-actions/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/redux-wait-actions
[david-dm-image]:https://img.shields.io/david/moxystudio/redux-wait-actions.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/redux-wait-actions?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/redux-wait-actions.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/redux-wait-actions.svg
[greenkeeper-url]:https://greenkeeper.io
[conventional-commits-url]:https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg

> Waits for actions to be dispatched until a timeout expires.


## Installation

`$ npm install redux-wait-actions --save-dev`


## Motivation

This module shall be used only for testing purposes to wait for the dispatch of actions that are dispatched in an asynchronous fashion by thunks.

When `thunk` dispatches various actions asynchronously, the following test will fail:

```js
store.dispatch(thunk(...));

expect(store.getActions()).toEqual(expect.arrayContaining(expectedActions));
```

To solve this, one can use `setTimeout` explicitly in each test:

```js
store.dispatch(thunk(...));

setTimeout(() => {
	expect(store.getActions()).toEqual(expect.arrayContaining(expectedActions));
}, 50);
```

To get around this ugliness, Redux Wait Actions sets the timeout for you and returns a `Promise` to wait for actions dispatch and handle timeouts.


## Usage

### Example #1: single action

```js
const waitForActions = require('redux-wait-actions');

const action = { type: 'action' };

const promise = waitForActions(store, action);

store.dispatch(action);

await promise;

```

### Example #2: thunk

```js
const waitForActions = require('redux-wait-actions');

const action1 = { type: 'action1' };
const action2 = { type: 'action1' };
const action3 = { type: 'action1' };
const thunk = () => (dispatch, getState, customArgument) => {
	dispatch(action1);
	dispatch(action2);
	dispatch(action3);
};

const promise = waitForActions(store, [action1, action2, action3]);

store.dispatch(thunk());

await promise;

```

## API

### waitForActions(store, actions, [options])

Returns a `Promise` which fulfills if all `actions` are dispatched before the timeout expires, otherwise it is rejected.

#### store

Type: `Object`

The Redux store.

#### actions

Type: `Object` `Array`

The actions to wait for.

#### options

##### timeout

Type: `Number`<br>
Default: 50

The timeout given in milliseconds.

##### actionArgument

Type: any<br>
Default: undefined

A custom argument to inject in thunk actions.

## Tests

`$ npm test`   
`$ npm test:watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
