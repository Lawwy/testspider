// jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
var Frame = require('../frame.js');
var EventEmitter = require('events').EventEmitter;

xdescribe("#basic", function() {
  it("#do", function(done) {
    var frame = new Frame();
    frame.do({}, function(err, res) {
      expect(res).toEqual({});
      done();
    });
  });

  it("#main", function(done) {
    var frame = new Frame();
    frame.main(function(data, next) {
      data.resp = {
        body: 'helloworld'
      };
      next();
    });
    frame.do({}, function(err, res) {
      expect(res.resp).toEqual({
        body: 'helloworld'
      });
      done();
    });
  });

  it("#pre", function() {
    var frame = new Frame();
    frame.main(function(data, next) {
      data.resp = {
        body: 'helloworld'
      };
      next();
    })
    frame.pre(function(data, next) {
      if (!data.a) {
        data.a = 'www.hello.com'
      }
      next();
    });
    frame.pre(function(data, next) {
      if (!data.a) {
        data.a = 'www.baidu.com';
      }
      data.b = 'hello';
      setTimeout(function() {
        next();
      }, 100);
    })
    frame.do({}, function(err, res) {
      expect(res.a).toEqual('www.hello.com');
      expect(res.b).toEqual('hello');
      expect(res.resp).toEqual({
        body: 'helloworld'
      });
      done();
    })
  });

  it("#post", function() {
    var frame = new Frame();
    frame.main(function(data, next) {
      data.resp = {
        body: 'helloworld'
      };
      next();
    })
    frame.post(function(data, next) {
      if (!data.resp.a) {
        data.resp.a = 'a'
      }
      next();
    });
    frame.post(function(data, next) {
      if (!data.resp.a) {
        data.resp.a = 'A';
      }
      data.resp.b = 'b';
      setTimeout(function() {
        next();
      }, 100);
    })
    frame.do({}, function(err, res) {
      expect(res.resp).toEqual({
        body: 'helloworld',
        a: 'a',
        b: 'b'
      });
      done();
    })
  })

  // it('#empty', function() {
  //   console.log('#empty');
  //   var frame = new Frame();
  //   frame.do();
  // })

  describe('#err handle', function() {
    it("#main err", function(done) {
      var frame = new Frame();
      frame.main(function(data, next) {
        var e = new Error('mainErr');
        return next(e)
      })
      frame.do({}, function(err, data) {
        expect(err.message).toEqual('mainErr');
        expect(data).toEqual({});
        done();
      })
    });

    it("#pre err", function(done) {
      var frame = new Frame();
      frame.main(function(data, next) {
        data.main = '1';
        return next();
      })
      frame.pre(function(data, next) {
        var e = new Error('preErr');
        return next(e);
      })
      frame.do({}, function(err, data) {
        expect(err.message).toEqual('preErr');
        expect(data).toEqual({});
        done();
      })
    });

    it("#post err", function(done) {
      var frame = new Frame();
      frame.main(function(data, next) {
        data.main = '1';
        return next();
      })
      frame.post(function(data, next) {
        var e = new Error('postErr');
        return next(e);
      })
      frame.do({}, function(err, data) {
        expect(err.message).toEqual('postErr');
        expect(data).toEqual({
          main: '1'
        });
        done();
      })
    })

    it("#add err Handle", function(done) {
      var frame = new Frame();
      frame.err(function(err, data, next) {
        err.a = 'a';
        return next(err);
      });
      frame.err(function(err, data, next) {
        data.err = 'err';
        return next(err);
      });
      frame.main(function(data, next) {
        data.main = '1';
        return next();
      })
      frame.pre(function(data, next) {
        var e = new Error('postErr');
        return next(e);
      })
      frame.do({}, function(err, data) {
        expect(err.message).toEqual('postErr');
        expect(err.a).toEqual('a');
        expect(data).toEqual({
          err: 'err'
        });
        done();
      })
    })
  })
});

xdescribe('#测试嵌套', function() {
  it("#more frame", function(done) {
    var sf1 = new Frame(function(data, next) {
      data.sf1 = true;
      return next();
    })
    var sf2 = new Frame(function(data, next) {
      data.sf2 = true;
      return next();
    })
    var sf3 = new Frame(function(data, next) {
      var err = new Error('sf3 error');
      return next(err);
    });
    var sf4 = new Frame(function(data, next) {
      data.sf4 = true;
      return next();
    })
    var sf = new Frame();
    sf.pre(sf1.do.bind(sf1));
    sf.pre(sf2.do.bind(sf2));
    sf.pre(sf3.do.bind(sf3));
    sf.err(function(err, data, next) {
      err.sf = true;
      return next();
    })
    sf.do({}, function(err, data) {
      expect(data.sf1).toBe(true);
      expect(data.sf2).toBe(true);
      expect(data.sf4).toBeUndefined();
      expect(err.message).toEqual('sf3 error');
      expect(err.sf).toBe(true);
      done();
    })
  });
})

xdescribe("#this test", function() {
  function Item(rate) {
    this.rate = rate;
  }
  Item.prototype.test = function(data, next) {
    data.result = data.result || 1;
    data.result = this.produce(data.result);
    return next(null, data);
  };
  Item.prototype.produce = function(num) {
    return num * this.rate;
  };

  it("#test single", function(done) {
    var item1 = new Item(2);
    var frame = new Frame(item1.test.bind(item1));
    frame.post(function(data, next) {
      if (data.result) {
        data.result = data.result * 2;
      }
      return next(null, data);
    });
    frame.do({}, function(err, data) {
      expect(data.result).toBe(4);
      done();
    })
  });

  it("#测试嵌套", function(done) {
    var item1 = new Item(2);
    var item2 = new Item(3);
    var frame1 = new Frame(item1.test.bind(item1));
    var frame2 = new Frame(item2.test.bind(item2));
    var frame = new Frame();
    frame.pre(frame1.do.bind(frame1));
    // frame.pre(function(data, next) {
    //   var e = new Error('test err');
    //   return next(e, data);
    // })
    // frame.err(function(err, data, next) {
    //   data.result = data.result + 11;
    //   return next(err, data);
    // })
    frame.pre(frame2.do.bind(frame2));
    frame.do({}, function(err, data) {
      expect(data.result).toBe(6)
      done();
    })
  });

});

describe("#真实测试", function() {
  it("#engine", function(done) {
    var downloader = new Frame(function(data, next) {
      console.log(arguments)
      if (!data.request) {
        return next(new Error('no req'), data);
      }
      setTimeout(function() {
        data.download = true;
        return next();
      }, 1000);
    })
    var main = new Frame();
    main.pre(function(data, next) {
      data = data || {};
      data.request = {
        url: "www.baidu.com"
      }
      return next();
    })
    main.pre(downloader.do.bind(downloader));
    main.do({}, function(err, data) {
      expect(data.request).toEqual({
        url: "www.baidu.com"
      });
      expect(data.download).toBe(true);
      done();
    })
  })
});
