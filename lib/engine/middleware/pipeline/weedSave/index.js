var wfs = require('wfdsss');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('mydebug:weedSave');

module.exports = saveHtml;

function saveHtml(data,next) {
  debug('saveHtml');
  var self = this;
  var resp = data.response;
  if(!resp||!resp.body){
    return next();
  }
  var html = resp.body;
  wfs.Pweedfsclient().then(function(client){
    client.write(new Buffer(html), {replication: 000},function(err,fileInfo) {
      if(!err&&fileInfo){
        debug('saveHtml SUCCESS',fileInfo);
        // var savepath = path.resolve('./lib/engine/data/fileInfos')+'/'+fileInfo.fid+'.json';
        // fs.writeFile(savepath,JSON.stringify(fileInfo),function(e) {
        //   debug(e);
        // });
      }else{
        debug('saveHtml FAIL',err.message);
        // debug(err);
      }
    })
  })
  return next();
}
