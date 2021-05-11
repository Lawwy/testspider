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

// getService('queue_service').then(function(service) {
//   console.log(JSON.stringify(service));
// }).catch(function(e) {
//   console.error(e);
// })

var nats = require('nats');
var async = require('async');
var dw = require('./index.js');
var fs = require('fs');
var _ = require('underscore');

function downloader(task, cb) {
  var defer = Q.defer();
  var download = dw(task.isDynamic);
  console.log('**** start to download ' + task.url);
  var options = task.requestOptions || {};
  options.url = task.url;
  download(options, function(e, page) {
    if (e)
      return defer.reject(e);
    return defer.resolve(page);
  });
  return defer.promise;
}

var save_path = __dirname + '/html/';

function save(page, cb) {
  var name = save_path + 'html_' + new Date().toString() + '.html';
  console.log('****** save ' + name);
  fs.writeFile(name, page, function(e) {
    if (e) {
      return cb(e);
    } else {
      return cb(null, name);
    }
  })
}

var queue_service_name = 'queue_service';
var task_queue_name = 'download_task_queue';
var queue_service_address = null;

function start() {
  console.log(task_queue_name);
  console.log('listening to queue:' + task_queue_name);
  getService(queue_service_name)
    .then(function(address) {
      console.log(address);
      queue_service_address = address;
      nats = nats.connect(queue_service_address);
      nats.subscribe(task_queue_name, {
        'queue': task_queue_name
      }, doStart);
    }).catch(function(e) {
    console.error(e);
    process.exit();
  })
}

//obstolate
function getQueueService(name, cb) {
  var defer = Q.defer();
  consul.agent.service.list(function(e, list) {
    console.log(list);
    var node = list[name];
    if (!node) {
      return defer.reject(new Error('service no exists'));
    }
    var address = '';
    address += node.Address ? node.Address : "localhost";
    address += node.Port ? ':' + node.Port : '';
    return defer.resolve(address);
  })
  return defer.promise;
}

function getService(name) {
  // var defer = Q.defer();
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
/*
task:
{
  projectId:'***',
  responseQueueName:'***',
  saveAddress:'***',
  url:'***',
  requestOptions:{}
}
*/

function doStart(msg, reply) {
  var task = JSON.parse(msg.toString());
  var res_queue = reply || task.responseQueueName;
  console.log('******get task');
  console.log(task);
  console.log('******reply');
  console.log(reply);
  var dw_serv = '';
  var res = {};
  res.data = {};
  register(task)
    .then(function(sName) {
      dw_serv = sName;
      return downloader(task);
    })
    .then(function(page) {
      console.log('finish download');
      return save(page, task)
    })
    .then(function(path) {
      res.success = true;
      res.data.task = task;
      res.data.path = path;
      console.log(res);
      nats.publish(res_queue, new Buffer(JSON.stringify(res)));
      return deregister(dw_serv.name);
    })
    .catch(function(e) {
      console.log(e);
      res.success = false;
      res.data.task = task;
      // task.ResponseQueueName
      nats.publish(res_queue, new Buffer(JSON.stringify(res)));
      return deregister(dw_serv.name);
    })

}

function save(page, task) {
  console.log('start to save');
  var defer = Q.defer();
  var path = '';
  // console.log(page);
  path += task.saveAddress || __dirname + '/html/';
  path += new Date().getTime().toString() + '.html';
  console.log(path);
  fs.writeFile(path, page, function(e) {
    if (e)
      return defer.reject(e);
    return defer.resolve(path);
  })
  return defer.promise;
}

function register(task) {
  var defer = Q.defer();
  var serviceName = 'downloader_for_project_' + task.projectId;
  var serviceOpts = {
    name: serviceName,
    tag: ['downloader', task.projectId, task.url]
  }
  consul.agent.service.register(serviceOpts, function(err) {
    if (err)
      return defer.reject(err);
    console.log('register finish');
    return defer.resolve(serviceOpts);
  })
  return defer.promise;
}

function deregister(name) {
  var defer = Q.defer();
  consul.agent.service.deregister(name, function(err) {
    if (err)
      return defer.reject(err);
    console.log('deregister finish');
    return defer.resolve();
  })
  return defer.promise;
}

start();
