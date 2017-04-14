var fs = require('fs');

module.exports = loadDir2;

function load(base) {
  var mws = {}
  if (fs.existsSync(base + '/index.js')) {
    mws.main = require(base + '/index.js');
  }
  mws.pre = loadDir(base + '/pre');
  mws.post = loadDir(base + '/post');
  mws.err = loadDir(base + '/err');
  return mws;
}

function loadDir(path) {
  var fns = {};
  if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
    var fsNames = fs.readdirSync(path);
    fsNames.forEach(function(f) {
      if (fs.statSync(path + '/' + f).isDirectory()) {
        return;
      }
      var key = f.split('.')[0];
      fns[key] = require(path + '/' + f);
    })
  }
  return fns;
}

function loadDir2(path) {
  var fns = {};
  if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
    var fsNames = fs.readdirSync(path);
    fsNames.forEach(function(f) {
      if (fs.statSync(path + '/' + f).isDirectory()) {
        fns[f] = require(path + '/' + f);
      }
    })
  }
  return fns;
}
