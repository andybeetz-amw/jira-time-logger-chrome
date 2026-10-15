/**
 * Rpc.js file
 *
 * Typed message envelope shared by the service worker and the pages, and a runtime.onMessage
 * handler factory that always answers.
 *
 * Envelope:  {id, source, type, data}
 * Response:  {ok: true, result} | {ok: false, error}
 */

let nextId = 0;

/**
 * @param String source Who is sending, e.g. 'ui-index', 'sw'
 * @param String type
 * @param * data Must be structured-cloneable
 * @returns Object
 */
export function createEnvelope(source, type, data)
{
    return {id: source + ':' + Date.now() + ':' + (nextId++), source: source, type: type, data: data};
}

/**
 * @param * message
 * @returns Boolean
 */
export function isEnvelope(message)
{
    return !!message && typeof message === 'object' && typeof message.type === 'string' && typeof message.id === 'string';
}

/**
 * Build a runtime.onMessage listener that dispatches envelopes to handlers by type.
 *
 * Every envelope gets exactly one sendResponse call (success, unknown type, or handler error), so
 * the sender's promise never rejects with "message port closed". `return true` is used only while
 * a handler's result is pending; non-envelope messages are ignored (return false) so other
 * listeners can answer them.
 *
 * @param Object handlers Map of type => function(data, sender) returning a value or a Promise
 * @returns Function
 */
export function createMessageListener(handlers)
{
    return function(message, sender, sendResponse)
    {
        if (!isEnvelope(message)) {
            return false;
        }
        const handler = Object.prototype.hasOwnProperty.call(handlers, message.type) ? handlers[message.type] : null;
        if (!handler) {
            sendResponse({ok: false, error: 'Unknown message type: ' + message.type});
            return false;
        }
        Promise.resolve()
            .then(() => handler(message.data, sender))
            .then(
                (result) => sendResponse({ok: true, result: result}),
                (error) => sendResponse({ok: false, error: String((error && error.message) || error)})
            );
        return true;
    };
}

/**
 * Send an envelope to the other side (background/service worker) and resolve with the handler's result.
 *
 * Rejects if there is no receiver (e.g. the service worker could not start), or the handler answered
 * {ok: false}. Uses the callback form so it behaves the same under MV2 and MV3.
 *
 * @param String source
 * @param String type
 * @param * data
 * @returns Promise
 */
export function rpcCall(source, type, data)
{
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(createEnvelope(source, type, data), (response) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                reject(new Error(lastError.message));
            } else if (!response || !response.ok) {
                reject(new Error((response && response.error) || 'No response'));
            } else {
                resolve(response.result);
            }
        });
    });
}
