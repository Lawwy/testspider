jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
var Scheduler = require('../scheduler.js');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var Downloader = require('../../downloader/downloader.js');
var projList = require('./data/project.json');

describe("#initial instance", function() {
  it("# new()", function() {
    var scheduler = new Scheduler();
    expect(scheduler instanceof Scheduler).toBe(true);
    expect(scheduler instanceof EventEmitter).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('start')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('stop')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('doStart')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('check')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('isFree')).toBe(true);
    expect(scheduler.state).toBe("initial");
  });

  it("# new with factory", function() {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    expect(scheduler.factory.hasOwnProperty('Downloader')).toBe(true);
    expect(scheduler instanceof EventEmitter).toBe(true);
    var dw = new scheduler.factory.Downloader();
    expect(dw instanceof Downloader).toBe(true);
  })
});

describe('#start Project', function() {
  it("# doStart()", function(done) {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    scheduler.on('done', function(remains, sche) {
      expect(remains.q_finished.length).toBe(0);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.q_running.length).toBe(0);
      expect(remains.project).toBeUndefined();
      sche = null;
      scheduler = null;
      done();
    });
    scheduler.doStart();
  });

  it("# start()", function(done) {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    var project = projList[0];
    expect(scheduler.isFree()).toBe(true);
    scheduler.on('done', function(remains, sche) {
      expect(remains.q_finished.length).toBe(2);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.q_running.length).toBe(0);
      expect(remains.project).toEqual(project);
      sche = null;
      scheduler = null;
      done();
    })
    scheduler.start(project);
    expect(scheduler.isFree()).toBe(false);
    expect(scheduler.state).toBe('running');
  })

  it("# stop", function(done) {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    var project = projList[0];
    scheduler.on('done', function(remains, sche) {
      expect(remains.q_finished.length).toBe(1);
      expect(remains.q_todo.length).toBe(1);
      expect(remains.q_running.length).toBe(0);
      expect(remains.project).toEqual(project);
      sche.removeAllListeners(); //??不加这句导致# err handler测试出错
      sche = null;
      scheduler = null;
      done();
    })
    scheduler.on('download_finish', function(resp, sche) {
      sche.stop();
    })
    scheduler.start(project);
    expect(scheduler.state).toBe('running');
  })
})

describe("# err handler", function() {
  it("wrong start_url", function(done) {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    var project = projList[1];
    scheduler.on('done', function(remains, sche) {
      expect(remains.q_finished.length).toBe(0);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.q_running.length).toBe(0);
      expect(remains.project).toEqual(project);
      expect(remains.bad_urls["http://www.djlkjnraojc.com"]).toBe(3);
      sche = null;
      scheduler = null;
      done();
    })
    scheduler.start(project);
    expect(scheduler.state).toBe('running');
  });
});

describe("#depth control", function() {
  it("# depth control start", function(done) {
    var scheduler = new Scheduler({
      Downloader: Downloader
    });
    var project = projList[2];
    expect(scheduler.isFree()).toBe(true);
    scheduler.on('done', function(remains, sche) {
      expect(remains.q_finished.length).toBe(1);
      expect(remains.q_todo.length).toBe(0);
      expect(remains.q_running.length).toBe(0);
      expect(remains.project).toEqual(project);
      sche = null;
      scheduler = null; //不加这句测试时间很久
      done();
    })
    scheduler.start(project);
    expect(scheduler.isFree()).toBe(false);
    expect(scheduler.state).toBe('running');
  });
});
