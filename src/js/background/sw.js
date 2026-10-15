/**
 * sw.js file
 *
 * MV3 service worker entry point. Not wired to the manifest yet (P2.8 flips it).
 *
 * Chrome only delivers the event that woke the worker to listeners registered synchronously during
 * the first turn of script evaluation, so every listener is registered at top level, before any
 * await. Other handlers are placeholders until alarms and notifications (P4) land.
 */

import {createMessageListener} from '../Rpc.js';

chrome.runtime.onInstalled.addListener(function(details)
{
    console.debug('sw: onInstalled', details.reason);
});

// Handlers are added per RPC type as P2.6 moves the background-page calls here; until then every
// envelope is answered with an "unknown type" error rather than left hanging.
const handlers = {};
chrome.runtime.onMessage.addListener(createMessageListener(handlers));

chrome.runtime.onConnect.addListener(function(port)
{
    console.debug('sw: onConnect', port.name);
});

chrome.alarms.onAlarm.addListener(function(alarm)
{
    console.debug('sw: onAlarm', alarm.name);
});

chrome.notifications.onClicked.addListener(function(notificationId)
{
    console.debug('sw: notifications.onClicked', notificationId);
});

chrome.storage.onChanged.addListener(function(changes, areaName)
{
    console.debug('sw: storage.onChanged', areaName, Object.keys(changes));
});
