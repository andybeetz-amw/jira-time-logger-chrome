/**
 * ui-config.js file
 *
 * Initialises the UI for the config page
 *
 * @author Aaron Baker <me@aaronbaker.co.uk>
 * @copyright Aaron Baker 2014
 */

import config from './Config.js';
import ConfigConstants from './ConfigConstants.js';
import view from './View/Config.js';
import listener from './Event/Listener/Config.js';
import containerFactory from './Container/Factory.js';

var forContext = 'ui-config';
containerFactory.get().registerCustomEventListener(ConfigConstants.EVENT_INITIALISED+'_'+forContext, function()
{
    view.init();
    listener.init();
});
config.init(forContext);
