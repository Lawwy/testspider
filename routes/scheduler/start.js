// module.exports = startRoute;

var _ = require('underscore');
var schedulerPool = require('../../lib/scheduler/factory.js');

module.exports = function(req, res, next) {
  console.log('enter start route');
  var projectId = req.params.id;
  var scheduler = schedulerPool.get(projectId);
  if (scheduler) {
    if (scheduler.state == 'running') {
      return res.json({
        success: true,
        msg: 'project have been started'
      })
    } else {
      scheduler.restart();
      if (scheduler.state == 'running') {
        return res.json({
          success: true,
          msg: 'successfully restart'
        })
      } else {
        return res.json({
          success: false,
          msg: 'restart fail'
        })
      }
    }
  } else {
    schedulerPool.create(projectId)
      .then(function(instance) {
        scheduler = instance;
        scheduler.start();
        if (scheduler.state == 'running') {
          return res.json({
            success: true,
            msg: 'successfully start'
          })
        } else {
          return res.json({
            success: false,
            msg: 'fail'
          })
        }
      })
      .catch(function(e) {
        return res.json({
          success: true,
          msg: e.message
        })
      });
  // if (!scheduler) {
  //   return res.json({
  //     success: false,
  //     msg: 'no such project'
  //   })
  // }
  // scheduler.start();
  // if (scheduler.state == 'running') {
  //   return res.json({
  //     success: true,
  //     msg: 'successfully start'
  //   })
  // } else {
  //   return res.json({
  //     success: false,
  //     msg: 'fail'
  //   })
  // }
  }
}
