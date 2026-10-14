require.config({
   baseUrl: "../src/js",
   paths: {
       jquery: "jquery.min",
       text: "require-plugin/text",
       json: "require-plugin/json",
       jasq: "../../tests/lib/jasq",
       mock: "../../tests/mock/"
   }
});

require([
    "./spec/App.js",
    "./spec/Config.js",
    "./spec/Jira.js",
    "./spec/Stopwatch.js",
    "./spec/Reminder.js",
], function () {
    window.jasmine.htmlReporter.initialize();
    window.jasmine.getEnv().execute();
});