var path = require('path');
var fs = require('fs');
var debug = require('debug')('mydebug:saveItem');

module.exports = save;

function save(data, next) {
  debug('saveItem');
  var self = this;
  var collections = data.collections;
  if (!collections || !collections.length) {
    return next();
  }
  var savepath = path.resolve('./lib/engine/data');
  savepath = savepath + '/' + new Date().getTime() + '.json';
  fs.writeFile(savepath, JSON.stringify(collections), function(e) {
    if (e) {
      e.type = 'save_fail';
      return next(e);
    } else {
      return next();
    }
  });
}
