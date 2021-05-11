var _ = require('underscore');
var schedulerPool = require('../../lib/scheduler/factory.js');

module.exports = function(req, res, next) {
  console.log('enter start route');
  var projectId = req.params.id;
  var scheduler = schedulerPool.get(projectId);
  if (!scheduler) {
    return res.json({
      success: false,
      msg: 'project is not exists'
    })
  }
  scheduler.stop();
  if (scheduler.state == 'stop') {
    return res.json({
      success: true
    })
  } else {
    return res.json({
      success: false
    })
  }
}
