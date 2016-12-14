var Expect = module.exports = {};

var _ = require('lodash'),
    fs = require('fs-extra'),
    axe = require('axe-webdriverjs'),
    protractor = require('protractor'),
    textReporter = require('./text-reporter'),
    junitReporter = require('./junit-reporter');


function makeFileName(url) {
  return './build2/reports/508/junit/' + url.split('://').pop().replace(/[\.\:\/]/g, '-') + _.uniqueId('_') + '.xml';
}

fs.emptyDirSync('./build2/reports/508');
fs.mkdirsSync('./build2/reports/508/text');
fs.mkdirsSync('./build2/reports/508/junit');

var textWriter = fs.createWriteStream('./build2/reports/508/text/report.txt');

Expect.toBeA11yCompliant = function () {
  var deferred = protractor.promise.defer();
  if ('{{{CHECK_A11Y}}}' === 'true') {
    axe(browser.driver)
    .analyze(function (result) {
      textReporter([result], 0, textWriter);
      junitReporter(result, makeFileName(result.url));
      deferred.fulfill();
    });
  } else {
    deferred.fulfill();
  }
  return deferred.promise;
};
