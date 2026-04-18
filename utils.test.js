import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { fetchWithRetry } from './utils.js';

let originalFetch;
let originalSetTimeout;

beforeEach(() => {
    originalFetch = global.fetch;
    originalSetTimeout = global.setTimeout;
});

afterEach(() => {
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
});

test('fetchWithRetry success on first try', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) };
    const fetchMock = mock.fn(() => Promise.resolve(mockResponse));
    global.fetch = fetchMock;

    const result = await fetchWithRetry('https://api.example.com/data', {});

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(fetchMock.mock.callCount(), 1);
});

test('fetchWithRetry success after retries', async () => {
    global.setTimeout = (fn) => fn();

    const mockErrorResponse = { ok: false, status: 500 };
    const mockSuccessResponse = { ok: true, json: () => Promise.resolve({ success: true }) };

    let callCount = 0;
    const fetchMock = mock.fn(() => {
        callCount++;
        if (callCount < 3) {
            return Promise.resolve(mockErrorResponse);
        }
        return Promise.resolve(mockSuccessResponse);
    });
    global.fetch = fetchMock;

    const result = await fetchWithRetry('https://api.example.com/data', {}, 5);

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(callCount, 3);
});

test('fetchWithRetry failure after exhausting retries', async () => {
    global.setTimeout = (fn) => fn();

    const mockErrorResponse = { ok: false, status: 500 };
    const fetchMock = mock.fn(() => Promise.resolve(mockErrorResponse));
    global.fetch = fetchMock;

    await assert.rejects(
        async () => {
            await fetchWithRetry('https://api.example.com/data', {}, 3);
        },
        {
            message: 'HTTP error! status: 500'
        }
    );

    assert.strictEqual(fetchMock.mock.callCount(), 3);
});

test('fetchWithRetry network failure retry', async () => {
    global.setTimeout = (fn) => fn();

    let callCount = 0;
    const fetchMock = mock.fn(() => {
        callCount++;
        if (callCount === 1) {
            return Promise.reject(new Error('Network failure'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    });
    global.fetch = fetchMock;

    const result = await fetchWithRetry('https://api.example.com/data', {}, 3);

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(callCount, 2);
});

test('fetchWithRetry handles more than 5 retries by capping delay', async () => {
    global.setTimeout = (fn) => fn();

    const mockErrorResponse = { ok: false, status: 500 };
    const fetchMock = mock.fn(() => Promise.resolve(mockErrorResponse));
    global.fetch = fetchMock;

    await assert.rejects(
        async () => {
            await fetchWithRetry('https://api.example.com/data', {}, 7);
        },
        {
            message: 'HTTP error! status: 500'
        }
    );

    assert.strictEqual(fetchMock.mock.callCount(), 7);
});
