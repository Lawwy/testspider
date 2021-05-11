var Q = require('q');
var _ = require('underscore');

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

//获取服务地址
function getService(name) {
  var self = this;
  return self.query.list()
    .then(function(querylist) {
      return findOrCreateQuery.call(self, querylist, name);
    })
    .then(function(q) {
      return self.query.execute(q.ID);
    })
    .then(function(service) {
      if (!service.Nodes.length) {
        throw Error('No such service');
      }
      var serviceNode = service.Nodes[0].Service;
      var address = '';
      address += serviceNode.Address ? serviceNode.Address : "localhost";
      address += serviceNode.Port ? ':' + serviceNode.Port : '';
      if (serviceNode.Tags) {
        var protocal = serviceNode.Tags[0] || '';
        address = (protocal ? protocal + '://' : '') + address;
      }
      return address;
    })
    .catch(function(e) {
      console.log(e);
      throw e;
    })
}

function findOrCreateQuery(list, name) {
  var self = this;
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
    self.query.create(qOpts, function(e, q) {
      if (e) {
        defer.reject(e);
      } else {
        defer.resolve(q);
      }
    })
  }
  return defer.promise;
}

module.exports = {
  fromCallback: fromCallback,
  getService: getService
}
