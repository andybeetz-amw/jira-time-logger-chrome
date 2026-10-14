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
require([
    'jquery',
    'Config',
    'ConfigConstants',
    'App',
    'Logger',
    'Container/Factory'
], function(
    $,
    config,
    ConfigConstants,
    app,
    logger,
    containerFactory
) {
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
});