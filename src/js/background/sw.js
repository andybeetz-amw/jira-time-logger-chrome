/**
 * sw.js file
 *
 * MV3 service worker entry point. Not wired to the manifest yet (P2.8 flips it).
 *
 * Chrome only delivers the event that woke the worker to listeners registered synchronously during
 * the first turn of script evaluation, so every listener is registered at top level, before any
 * await. Handlers are placeholders until the RPC core (P2.5+), alarms and notifications (P4) land.
 */

chrome.runtime.onInstalled.addListener(function(details)
{
    console.debug('sw: onInstalled', details.reason);
});

// Returning false: no async response is promised (the always-respond handler arrives in P2.5).
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.debug('sw: onMessage', request && request.type);
    return false;
});

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
