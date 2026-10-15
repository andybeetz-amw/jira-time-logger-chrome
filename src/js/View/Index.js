/**
 * Index.js file
 *
 * Contains the Index class.
 *
 * @author Aaron Baker <me@aaronbaker.co.uk>
 * @copyright Aaron Baker 2014
 */

import $ from 'jquery';
import containerFactory from '../Container/Factory.js';
import AL from '../ActivityLog.js';
import JiraConstants from '../JiraConstants.js';
import config from '../Config.js';
import {rpcCall} from '../Rpc.js';

const ViewIndexModule = (function()
{

    /**
     * Index class
     *
     * Handles manipulating the HTML view on the main page
     *
     * @constructor
     */
    function Index()
    {
        /**
         * @type Integer
         * @private
         */
        var timeManualTimeout = null;
        /**
         * @type Integer
         * @private
         */
        var issueTimeout = null;

        /**
         * Get the manual time timeout
         *
         * @return Integer
         */
        this.getTimeManualTimeout = function()
        {
            return timeManualTimeout;
        };

        /**
         * Set the manual time timeout
         *
         * @param Integer newTimeManualTimeout
         * @returns self
         */
        this.setTimeManualTimeout = function(newTimeManualTimeout)
        {
            timeManualTimeout = newTimeManualTimeout;
            return this;
        };

        /**
         * Get the issue timeout
         *
         * @return Integer
         */
        this.getIssueTimeout = function()
        {
            return issueTimeout;
        };

        /**
         * Set the issue timeout
         *
         * @param Integer newIssueTimeout
         * @returns self
         */
        this.setIssueTimeout = function(newIssueTimeout)
        {
            issueTimeout = newIssueTimeout;
            return this;
        };

        /**
         * Call the background app over RPC
         *
         * @param String type
         * @param * data
         * @returns Promise
         */
        this.rpc = function(type, data)
        {
            return rpcCall('ui-index', type, data);
        };

        /**
         * Get the Application instance
         *
         * @returns App
         */
        this.getApp = function()
        {
            return containerFactory.get().getAppInstance();
        };

        /**
         * Get the config
         *
         * @returns Config
         */
        this.getConfig = function()
        {
            return config;
        };
    }

    /**
     * @constants
     */
    Index.AL_COLOUR_MAP = {};
    Index.AL_COLOUR_MAP[AL.LEVEL_INFO] = '#5bb75b';
    Index.AL_COLOUR_MAP[AL.LEVEL_WARN] = '#f6b83f';
    Index.AL_COLOUR_MAP[AL.LEVEL_ERROR] = '#b75b5b';

    /**
     * Initialise the view
     *
     */
    Index.prototype.init = function()
    {
        var self = this;
        $(document).ready(function()
        {
            self._populateActivityLog()
                ._setVersion()
                ._setCopyrightYear()
                .updateTimeAuto()
                .updateLoggedTotal()
                .updateDayGrandTotal();
        });
    };

    /**
     * Log a message to the activity log
     *
     * @param ActivityLog activityLog
     * @param Bool animate Animate the adding of the message? Default: true
     */
    Index.prototype.addActivityLog = function(activityLog, animate)
    {
        animate = (animate === undefined ? true : animate);
        var message = activityLog.getMessage();
        var level = activityLog.getLevel();
        var dateTimeLogged = activityLog.getDateTimeLogged();

        message = message.replace(/\n/g, '; ');
        level = (level) ? level : AL.LEVEL_INFO;
        dateTimeLogged = dateTimeLogged.toLocaleString();

        var userLog = $('<div class="userLog '+level.toLowerCase()+'" title="'+dateTimeLogged+'">'+level+': '+message+'</div>');
        $('#userLogContainer').prepend(userLog).scrollTop(0);
        if (animate) {
            var colour = Index.AL_COLOUR_MAP[level];
            userLog.css({backgroundColor: colour});
            userLog[0].offsetWidth; // force reflow so the transition starts from the colour
            userLog.css({transition: 'background-color 1.5s', backgroundColor: 'transparent'});
        }
    };

    /**
     * Remove an entry from the activity log
     *
     * @param ActivityLog message
     */
    Index.prototype.removeActivityLog = function(activityLog)
    {
        $('.userLog[title="'+activityLog.getDateTimeLogged().toLocaleString()+'"]').remove();
    };

    /**
     * Show manual time entry
     *
     */
    Index.prototype.showTimeManual = function()
    {
        if ($('#timeManual').is(':visible')) {
            return;
        }
        $('#timeAuto').hide();
        $('#timeManual').show().focus();
        $('#clearTimeButton').text('Cancel');
    };

    /**
     * Show automaticly calculated time
     *
     */
    Index.prototype.showTimeAuto = function()
    {
        if ($('#timeAuto').is(':visible')) {
            return;
        }
        $('#timeManual').val('').keyup().hide();
        $('#timeAuto').show();
        $('#clearTimeButton').text('Reset');
    };

    /**
     * Handle a time being manually entered
     * 
     */
    Index.prototype.manualTimeEntered = function()
    {
        if (this.getTimeManualTimeout()) {
            clearTimeout(this.getTimeManualTimeout());
        }
        var timeManualTimeout = setTimeout(function()
        {
            if (!$('#timeManual').val().match(new RegExp(JiraConstants.TIME_REGEX))) {
                $('#timeManual').parent().parent().parent().addClass('danger');
            } else {
                $('#timeManual').parent().parent().parent().removeClass('danger');
            }
        }, 500);
        this.setTimeManualTimeout(timeManualTimeout);
    };

    /**
     * Handle an issue key being entered
     *
     */
    Index.prototype.issueKeyEntered = function()
    {
        if (this.getIssueTimeout()) {
            clearTimeout(this.getIssueTimeout());
        }
        $('#summary').text('*Waiting...*');
        var self = this;
        var issueTimeout = setTimeout(function()
        {
            var issueKey = $('#issue').val();
            if (issueKey.match(new RegExp(JiraConstants.ISSUE_KEY_REGEX))) {
                self._checkIssueKey(issueKey);
                return;
            }
            if ($.isNumeric(issueKey)) {
                var defaultProjectKey = self.getConfig().get('defaultProjectKey', 'jtl');
                if (defaultProjectKey) {
                    issueKey = defaultProjectKey + '-' + issueKey;
                    $('#issue').val(issueKey);
                    self._checkIssueKey(issueKey);
                    return;
                }
            }

            $('#issue').parent().addClass('danger');
            $('#summary').html('*Invalid issue key*');
        }, 500);
        this.setIssueTimeout(issueTimeout);
    };

    /**
     * Set an issue key
     *
     * @param String issue
     */
    Index.prototype.enterIssueKey = function(issue)
    {
        $('#issue').val(issue);
        $('#issue').keyup();
    };

    /**
     * Trigger submission of the time form
     *
     */
    Index.prototype.submitTimeForm = function()
    {
        $('#loggerForm').submit();
    };

    /**
     * Validate the time form
     *
     * @returns Array Errors
     */
    Index.prototype.validateTimeForm = function()
    {
        var app = this.getApp();
        $('#loggerForm li.danger').removeClass('danger');
        var errors = [];
        if (app.getTimeManual()) {
            if (!$('#timeManual').val().match(new RegExp(JiraConstants.TIME_REGEX)) || $('#timeManual').val() == '') {
                $('#timeManual').parent().parent().parent().addClass('danger');
                errors.push('\''+$('#timeManual').val()+'\' does not appear to be a valid JIRA time phrase');
            }
        }
        if (!$('#issue').val().match(new RegExp(JiraConstants.ISSUE_KEY_REGEX)) || $('#issue').val() == '') {
            $('#issue').parent().addClass('danger');
            errors.push('\''+$('#issue').val()+'\' does not appear to be a valid JIRA issue key');
        }

        return errors;
    };

    /**
     * Get all the values of the form
     *
     * @returns Object Field name / value pairs
     */
    Index.prototype.getTimeFormValues = function()
    {
        var app = this.getApp();
        var values = {};
        $('#loggerForm').find('input, select, textarea').each(function() {
            values[$(this).attr('name')] = $(this).val();
            if ($(this).attr('type') === 'checkbox') {
                if ($(this).is(':checked')) {
                    values[$(this).attr('name')] = true;
                } else {
                    values[$(this).attr('name')] = false;
                }
            }
        });

        var roundToNearest = 'min';
        values.time = (app.getTimeManual() ? $('#timeManual').val() : app.getTimeAutoAsString(roundToNearest));
        var summary = $('#summary').text();
        if (summary != '' && summary.indexOf(values.issue) < 0 && summary.indexOf('...') < 0) {
            values.summary = summary;
        }

        return values;
    };

    /**
     * Reset the values of the form
     *
     */
    Index.prototype.resetTimeForm = function()
    {
        $('#loggerForm li.danger').removeClass('danger');
        $('#summary').html('&nbsp;');
        $('#loggerForm').get(0).reset();
        this.showTimeAuto();
    };

    /**
     * Show a message to say the JIRA connection is being tested
     *
     */
    Index.prototype.showJiraTestMessage = function()
    {
        var mask = '<div id="mask">'
        mask += '<div id="maskText">Testing JIRA connection, please wait<br />';
        mask += '<img src="app://images/spinner.gif" alt="*" width="16" height="16" /></div>';
        mask += '</div>';
        $('body').append(mask);
    };

    /**
     * Hide the JIRA test message
     *
     */
    Index.prototype.hideJiraTestMessage = function()
    {
        $('#mask').remove();
    };

    /**
     * Update the logged total value
     *
     * @param String total
     * @returns self
     */
    Index.prototype.updateLoggedTotal = function(total)
    {
        this._setText('#loggedTotal', total, 'getLoggedTotalAsString');
        return this;
    };

    /**
     * Update the daily grand total value
     *
     * @param String total
     * @returns self
     */
    Index.prototype.updateDayGrandTotal = function(total)
    {
        this._setText('#dayGrandTotal', total, 'getDayGrandTotalAsString');
        return this;
    };

    /**
     * Update the auto time value
     *
     * @param String time
     * @returns self
     */
    Index.prototype.updateTimeAuto = function(time)
    {
        this._setText('.timeAuto', time, 'getTimeAutoAsString');
        return this;
    };

    /*
     * Private methods
     *
     * No such thing in JavaScript, just conceptual
     */

    /**
     * Set the text of an element: to the given value, or to the result of an RPC call if none is given
     *
     * @param String selector
     * @param String value
     * @param String rpcType
     * @returns self
     * @private
     */
    Index.prototype._setText = function(selector, value, rpcType)
    {
        if (value) {
            $(selector).text(value);
            return this;
        }
        this.rpc(rpcType).then(function(result)
        {
            $(selector).text(result);
        }, function(error)
        {
            console.error(rpcType + ' failed:', error);
        });
        return this;
    };

    /**
     * Set the version string
     *
     * @returns self
     * @private
     */
    Index.prototype._setVersion = function()
    {
        this.rpc('getVersion').then(function(version)
        {
            $('#version').text('v'+version);
        }, function(error)
        {
            console.error('getVersion failed:', error);
        });
        return this;
    };

    /**
     * Set the copyright year
     *
     * @returns self
     * @private
     */
    Index.prototype._setCopyrightYear = function()
    {
        var date = new Date();
        $('#copyYear').text(date.getFullYear());
        return this;
    };

    /**
     * Populate the activity log
     *
     * @returns self
     * @private
     */
    Index.prototype._populateActivityLog = function()
    {
        var self = this;
        this.rpc('getActivityLogs').then(function(logs)
        {
            var animate = false;
            for (var index in logs) {
                var log = logs[index];
                self.addActivityLog(new AL(log.message, log.level, new Date(log.dateTimeLogged)), animate);
            }
        }, function(error)
        {
            console.error('getActivityLogs failed:', error);
        });
        return this;
    };

    /**
     * Check an issue key against JIRA and update the summary info
     *
     * @param String issueKey
     * @returns self
     */
    Index.prototype._checkIssueKey = function(issueKey)
    {
        $('#issue').parent().removeClass('danger');
        $('#summary').text('*Checking...*');
        // Responses can arrive out of order while the user keeps typing: only the latest check may write.
        var check = this._issueCheck = (this._issueCheck || 0) + 1;
        var self = this;
        var show = function(summary)
        {
            if (check === self._issueCheck) {
                $('#summary').text(summary || issueKey + ' not found');
            }
        };
        this.rpc('getIssueSummary', {issueKey: issueKey}).then(show, function(error)
        {
            console.error('getIssueSummary failed:', error);
            show(null);
        });
        return this;
    };

    return new Index();
})();

export default ViewIndexModule;
