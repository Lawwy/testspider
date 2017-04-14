var _ = require('underscore');
var runner = require('../../lib/runner/runner.js');

module.exports = function(req, res, next) {
  console.log('enter start route');
  var p = req.body;
  if (!p) {
    return res.json({
      success: false,
      message: "parameters wrong"
    })
  }
  runner.create(p, function(e, r) {
    if (!e && r) {
      return res.json({
        success: true
      })
    } else {
      return res.json({
        success: false,
        message: e.message
      })
    }
  })
}
