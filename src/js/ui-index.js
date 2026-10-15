/**
 * ui-config.js file
 *
 * Initialises the UI for the main app popup
 *
 * @author Aaron Baker <me@aaronbaker.co.uk>
 * @copyright Aaron Baker 2014
 */

import config from './Config.js';
import ConfigConstants from './ConfigConstants.js';
import view from './View/Index.js';
import listener from './Event/Listener/Index.js';
import containerFactory from './Container/Factory.js';

var forContext = 'ui-index';
containerFactory.get().registerCustomEventListener(ConfigConstants.EVENT_INITIALISED+'_'+forContext, function()
{
    view.init();
    listener.init();
});
config.init(forContext);
