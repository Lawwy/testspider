// jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
var rewire = require('rewire');
var SpiderPool = rewire('../spiderPool.js');
var mockSpider = require('./data/mockSpider');

describe("#basic test", function() {
  var sp;
  beforeAll(function() {
    SpiderPool.__set__('Spider', mockSpider);
    sp = new SpiderPool(10);
  // sp = SpiderPool;
  })
  it("#getState", function() {
    expect(sp.getState()).toEqual({
      total: 10,
      free: 10
    });
  });

  it("#create", function(done) {
    var prj = {
      id: 1
    };
    var flag = 0;
    var both = 0;
    sp.on('update', function(state) {
      if (flag == 1) {
        console.log('update done');
        both++;
        expect(state).toEqual({
          total: 10,
          free: 10
        });
        if (both == 2) {
          sp.removeAllListeners();
          done();
        }
      }
      if (flag == 0) {
        console.log('update start');
        expect(state).toEqual({
          total: 10,
          free: 9
        });
        flag++;
      }
    });
    sp.on('spider_done', function() {
      both++;
      console.log('spider done');
      expect(sp.getState()).toEqual({
        total: 10,
        free: 10
      });
      if (both == 2) {
        sp.removeAllListeners();
        done();
      }
    })
    sp.create(prj, function(err, result) {
      expect(result).toBe(true);
      expect(sp.getState()).toEqual({
        total: 10,
        free: 9
      });
    });
  });

  it("#stop", function(done) {
    var prj = {
      id: 2
    }
    sp.create(prj, function(err, result) {
      expect(result).toBe(true);
      expect(sp.getState()).toEqual({
        total: 10,
        free: 9
      });
    });
    var startTime = new Date().getTime();
    sp.stop(prj, function(err, remains) {
      expect(sp.getState()).toEqual({
        total: 10,
        free: 10
      });
      sp.removeAllListeners();
      done();
    });
  });

  xit("#update", function(done) {
    var p1 = {
      id: 1
    };
    // var initState = sp.getState();
    var flag = 0;
    sp.on('update', function(state) {
      if (flag == 1) {
        expect(state).toEqual({
          total: 10,
          free: 10
        });
        sp.removeAllListeners();
        done();
      }
      if (flag == 0) {
        expect(state).toEqual({
          total: 10,
          free: 9
        });
        flag++;
      }
    });
    sp.create(p1, function(err, result) {});
  })
});
