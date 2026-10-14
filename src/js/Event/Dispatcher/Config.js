/**
 * Config.js file
 *
 * Contains the Config class.
 *
 * @author Aaron Baker <me@aaronbaker.co.uk>
 * @copyright Aaron Baker 2014
 */

import Abstract from './Abstract.js';
import Constants from '../../ConfigConstants.js';

const ConfigModule = (function()
{

    /**
     * Config class
     *
     * Dispatch events pertaining to config
     *
     * @constructor
     */
    function Config()
    {
        Abstract.call(this);
    }

    Config.prototype = Object.create(Abstract.prototype);

    /**
     * Trigger the config initialised event
     *
     * @param String forContext Where the config is being initialised
     */
    Config.prototype.configInitialised = function(forContext)
    {
        this.dispatchEvent(Constants.EVENT_INITIALISED+'_'+forContext);
    };

    return new Config();
})();

export default ConfigModule;
