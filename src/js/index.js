/**
 * index.js file
 *
 * Contains the background process for running the app
 *
 * @author Aaron Baker <me@aaronbaker.co.uk>
 * @copyright Aaron Baker 2014
 */

/*
 * These variables MUST be global (albeit within the extension)
 * so the popup can access them (set on globalThis: the bundle is an IIFE) via chrome.extension.getBackgroundPage().appInstance
 */
import config from './Config.js';
import ConfigConstants from './ConfigConstants.js';
import app from './App.js';
import logger from './Logger.js';
import containerFactory from './Container/Factory.js';
import {createMessageListener} from './Rpc.js';

// RPC entry point for the popup/config pages; handlers are added per type from P2.6b.
chrome.runtime.onMessage.addListener(createMessageListener({}));

try {
    globalThis.appInstance = app;
    globalThis.configInstance = config;
    var forContext = 'index';
    containerFactory.get().registerCustomEventListener(ConfigConstants.EVENT_INITIALISED+'_'+forContext, function()
    {
        app.start();
    });
    config.init(forContext);
} catch (exception) {
    logger.error(exception);
    alert(exception + ' - A serious error ocurrred, the application will have to close');
    containerFactory.get().fatal(exception);
}
