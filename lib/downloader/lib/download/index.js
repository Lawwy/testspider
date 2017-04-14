var dynamicD = require('./dynamic.js');
var staticD = require('./static.js');

module.exports = function(isDynamic) {
  return isDynamic?dynamicD:staticD;
}
