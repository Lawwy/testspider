var Q = require('q');

function fromCallback(fn) {
  return Q.Promise(function(resolve, reject) {
    try {
      return fn(function(err, data, res) {
        if (err) {
          err.res = res;
          return reject(err);
        }
        return resolve(data);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

var consul = require('consul')({
  promisify: fromCallback
});

//获取服务地址
function getService(name) {
  if (queue_service_address) {
    return Q(queue_service_address);
  }
  return consul.query.list()
    .then(function(querylist) {
      return findOrCreateQuery(querylist, name);
    })
    .then(function(q) {
      return consul.query.execute(q.ID);
    })
    .then(function(service) {
      if (!service.Nodes.length) {
        throw Error('No such service');
      }
      var serviceNode = service.Nodes[0].Service;
      var address = '';
      address += serviceNode.Address ? serviceNode.Address : "localhost";
      address += serviceNode.Port ? ':' + serviceNode.Port : '';
      var protocal = serviceNode.Tags[0] || '';
      address = (protocal ? protocal + '://' : '') + address;
      queue_service_address = address;
      return address;
    })
}

function findOrCreateQuery(list, name) {
  var defer = Q.defer();
  var qName = 'query_' + name;
  var tq = _.find(list, function(query) {
    return query.Name == qName
  });
  if (tq) {
    defer.resolve(tq);
  } else {
    var qOpts = {
      name: qName,
      service: {
        service: name,
        onlypassing: true
      }
    }
    consul.query.create(qOpts, function(e, q) {
      if (e) {
        defer.reject(e);
      } else {
        defer.resolve(q);
      }
    })
  }
  return defer.promise;
}


var scheduler = require('../scheduler/scheduler.js');
var _ = require('underscore');

var schedulerPool = [];
var queue_service_address = null;
var queue_service_name = 'queue_service';

var get = function(id) {
  var target = _.find(schedulerPool, function(p) {
    return p.projectId == id
  });
  return target;
}

var create = function(id) {
  var defer = Q.defer();
  var s = get(id);
  if (s) {
    defer.resolve(s);
  }
  var options = _.find(projectsList, function(p) {
    return p.ID == id;
  })
  if (!options) {
    defer.reject(new Error('no such project'));
  } else {
    getService(queue_service_name)
      .then(function(service) {
        s = new scheduler(options, service);
        schedulerPool.push(s);
        defer.resolve(s);
      })
      .catch(function(e) {
        defer.reject(e);
      })
  }
  return defer.promise;
}

module.exports = {
  get: get,
  create: create,
  queue: queue_service_name
}
