var debug = require('debug')('mydebug:downloadMiddlewares');
var path = require('path');
var _ = require('underscore');
var consul_helper = require(path.resolve('./common/consulHelper/consul_helper.js'));
var consul = require('consul')({
  promisify: consul_helper.fromCallback
});
var nats = require('nats');
var record_queue = "current_state_queue";
var address = null;
var service = 'queue_service';

module.exports = {
  record: record,
  errRecord: errRecord
};

function record(data, next) {
  var response = data.response;
  if (!response) {
    return next();
  }
  var msg = {};
  msg.id = data.id;
  msg.name = data.name;
  msg.type = 'response';
  msg.content = _.omit(data.response, 'body');
  send(msg);
  next();
}

function errRecord(err, data, next) {
  var response = data.response;
  if (!err && !err.type == 'download_fail') {
    return next(err);
  }
  var msg = {};
  msg.id = data.id;
  msg.name = data.name;
  msg.type = 'err';
  send(msg);
  next();
}

function send(msg, cb) {
  try {
    if (nats.connected) {
      debug('send success record')
      nats.publish(record_queue, new Buffer(JSON.stringify(msg)));
    } else {
      var getService = consul_helper.getService.bind(consul);
      getService(service)
        .then(function(addr) {
          address = addr;
          nats = nats.connect(address);
          debug('send success record')
          nats.publish(record_queue, new Buffer(JSON.stringify(msg)));
        })
    }
  } catch (e) {
    debug(e.message);
  }
}
