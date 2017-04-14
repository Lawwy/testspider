var express = require('express');
var router = express.Router();
// var schedule = require('./scheduler/index.js');
var runner = require('./runner/index.js');
var parser = require('./parse/index.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});
router.all('/parse', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "accept, content-type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method == 'OPTIONS') {
    return res.status(204).end();
  }
  next();
})

router.post('/start', runner.start);
router.post('/stop', runner.stop);
router.post('/watch', runner.checkSpider);
router.get('/check', runner.check);
router.post('/parse', parser.parse);

module.exports = router;
