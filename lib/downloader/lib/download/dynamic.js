var cp = require('child_process');
var path = require('path');

module.exports = download;

function download(opts,cb) {
  var cmd = {
    command:'./phantomjs',
    args:[__dirname+'/phantomScript.js',JSON.stringify(opts)],
    options:{
      cwd:__dirname+'/bin/'
    }
  };
  var proc = cp.spawn(cmd.command,cmd.args,cmd.options);
  proc.on('exit', function(code) {
    if (code !== 0) {
      return cb(new Error('not exit with code 0'));
    } else {
      return cb(null,log);
    }
  });

  var log = '';

  proc.stdout.on('data',function(data) {
    log += data.toString();
  })

  proc.on('error', function(err) {
    console.log('err');
    console.error(err);
    return cb(err);
  });
}
