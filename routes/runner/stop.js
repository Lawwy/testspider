var _ = require('underscore');
var runner = require('../../lib/runner/runner.js');

module.exports = function(req, res, next) {
  console.log('enter stop route');
  var p = req.body;
  if (!p) {
    return res.json({
      success: false,
      message: "parameters wrong"
    })
  }
  runner.stop(p, function(e, r) {
    if (!e && r) {
      r.success = true;
      res.type('json');
      return res.send(r);
    } else {
      return res.json({
        success: false,
        message: e.message
      })
    }
  })
}
