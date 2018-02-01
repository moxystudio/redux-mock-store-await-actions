# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.0"></a>
# [2.0.0](https://github.com/moxystudio/redux-mock-store-await-actions/compare/v1.0.0...v2.0.0) (2018-02-01)


### Features

* add option to supply custom matchers ([#6](https://github.com/moxystudio/redux-mock-store-await-actions/issues/6)) ([907dbc0](https://github.com/moxystudio/redux-mock-store-await-actions/commit/907dbc0))


### BREAKING CHANGES

* convert timeout argument to an options object. This
commit introduces the matcher concept, which allows to supply a function
via options implementing custom comparison of actions. The predicate
function, which could be passed until now in the actions argument to
perform comparisons, is now no longer supported.



<a name="1.0.0"></a>
# 1.0.0 (2017-10-20)


### Features

* initial implementation ([e7162c6](https://github.com/moxystudio/redux-mock-store-await-actions/commit/e7162c6))
