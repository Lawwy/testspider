jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
var Engine = require('../engine.js');
var Scheduler = require('../../scheduler/scheduler3.js');
var parser = require('../../parser/parser.js');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var Downloader = require('../../downloader/downloader2.js');
var download = require('../../downloader/index.js');
var projList = require('./data/project.json');

describe("#initial instance", function() {
  it("# new()", function() {
    var engine = new Engine();
    expect(engine instanceof Engine).toBe(true);
    expect(engine instanceof EventEmitter).toBe(true);
    expect(Engine.prototype.hasOwnProperty('start')).toBe(true);
    expect(Engine.prototype.hasOwnProperty('stop')).toBe(true);
    expect(Engine.prototype.hasOwnProperty('doStart')).toBe(true);
    expect(Engine.prototype.hasOwnProperty('isFree')).toBe(true);
  });
});

describe('#test fn', function() {
  var factory = {
    Scheduler: Scheduler,
    Downloader: Downloader
  };
  var services = {
    contentparse: parser.contentparse,
    linkparse: parser.linkparse,
    download: download
  }
  it("# doStart()", function(done) {
    var engine = new Engine(factory, services);
    var prj = projList[0];
    engine.on('done', function(remains) {
      expect(remains.q_finished).toEqual([
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1',
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=2',
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=3',
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=4',
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=5'
      ]);
      expect(remains.q_todo.length).toBe(0);
      // console.log(remains);
      engine = null;
      done();
    })
    engine.start(prj);
  });

  it("# stop()", function(done) {
    var engine = new Engine(factory, services);
    var prj = projList[0];
    engine.on('done', function(remains) {
      expect(remains.q_finished).toEqual([
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1'
      ]);
      expect(remains.q_todo.length).toBe(4);
      // console.log(remains);
      engine = null;
      done();
    })
    engine.on('download_finish', function() {
      engine.stop();
    })
    engine.start(prj);
  });

  it("# bad start_url", function(done) {
    var engine = new Engine(factory, services);
    var prj = projList[0];
    prj.start_url = "http://www.djlkjnraojc.com";
    engine.on('done', function(remains) {
      expect(remains.q_finished.length).toEqual(0);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.bad_urls).toEqual({
        "http://www.djlkjnraojc.com": 3
      })
      engine = null;
      // console.log(remains);
      done();
    })
    engine.start(prj);
  });
});
