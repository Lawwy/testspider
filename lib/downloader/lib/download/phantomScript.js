var page = require('webpage').create();
var system = require('system');
var optStr;

if (system.args.length === 1) {
  phantom.exit(1);
} else {
  optStr = system.args[1];
  var options = JSON.parse(optStr);
  page.settings.userAgent = options.userAgent||'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36';
  page.settings.loadImages = options.loadImages||true;
  page.open(options.url, function(status) {
    console.log(page.content);
    phantom.exit();
  });
}
