'use strict';

function assertError(promise, error) {
    const promises = Object.entries(error).map(([key, value]) => expect(promise).rejects.toHaveProperty(key, value));

    return Promise.all(promises);
}

module.exports = assertError;
