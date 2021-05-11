var _ = require('underscore');
var runner = require('../../lib/runner/runner.js');

module.exports = function(req, res, next) {
  return res.json(runner.getState());
}
