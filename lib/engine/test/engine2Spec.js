jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
var Engine = require('../engine2.js');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var download = require('../middleware/downloader');
var linkparse = require('../middleware/linkparser');
var contentparse = require('../middleware/contentparser');
var projList = require('./data/project.json');

// var services = {
//   contentparse: contentparse,
//   linkparse: linkparse,
//   download: download
// }
var services = {};
var settings = {};

describe("#initial instance", function() {
  it("# new()", function() {
    var engine = new Engine(settings, services);
    expect(engine instanceof Engine).toBe(true);
    expect(engine instanceof EventEmitter).toBe(true);
    expect(Engine.prototype.hasOwnProperty('start')).toBe(true);
    expect(Engine.prototype.hasOwnProperty('stop')).toBe(true);
    expect(Engine.prototype.hasOwnProperty('isFree')).toBe(true);
  });
});

describe('#test fn', function() {
  it("# doStart()", function(done) {
    var engine = new Engine(settings, services);
    var prj = projList[0];
    engine.on('done', function(remains) {
      expect(remains.q_finished.length).toBe(5);
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=2');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=3');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=4');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=5');
      expect(remains.q_todo.length).toBe(0);
      // console.log(remains);
      engine = null;
      done();
    })
    engine.start(prj);
  });

  it("# stop()", function(done) {
    var engine = new Engine(settings, services);
    var prj = projList[0];
    engine.on('done', function(remains) {
      expect(remains.q_finished).toEqual([
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1'
      ]);
      expect(remains.q_todo.length).toBe(4);
      // console.log(remains);
      engine.removeAllListeners();
      engine = null;
      done();
    })
    engine.on('download_finish', function() {
      engine.stop();
    })
    engine.start(prj);
  });

  it("# bad start_url", function(done) {
    var engine = new Engine(settings, services);
    var prj = _.clone(projList[0]);
    prj.start_url = "http://www.djlkjnraojc.com";
    engine.on('done', function(remains) {
      expect(remains.q_finished.length).toEqual(0);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.bad_urls).toEqual({
        "http://www.djlkjnraojc.com": 3
      })
      engine = null;
      done();
    })
    engine.start(prj);
  });
});

xdescribe("# addition", function() {
  //由于浏览器下载耗时，只测一次下载
  it("# dynamic", function(done) {
    var engine = new Engine(settings, services);
    var prj = _.clone(projList[0]);
    prj.rule_store[0].request_options = {
      isDynamic: true
    };
    engine.on('done', function(remains) {
      expect(remains.q_finished).toEqual([
        'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1'
      ]);
      expect(remains.q_todo.length).toBe(4);
      // console.log(remains);
      engine.removeAllListeners();
      engine = null;
      done();
    })
    engine.on('download_finish', function() {
      engine.stop();
    })
    engine.start(prj);
  });

  xit("# proxy", function(done) {
    var engine = new Engine(settings, services);
    var prj = _.clone(projList[0]);
    //代理地址:未必一直可用
    prj.rule_store[0].request_options.proxy = "http://124.88.67.24:80";
    prj.rule_store[0].request_options.isDynamic = false;
    engine.on('done', function(remains) {
      expect(remains.q_finished.length).toBe(5);
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=2');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=3');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=4');
      expect(remains.q_finished).toContain('http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=5');
      expect(remains.q_todo.length).toBe(0);
      // console.log(remains);
      engine = null;
      done();
    })
    engine.start(prj);
  });
});
