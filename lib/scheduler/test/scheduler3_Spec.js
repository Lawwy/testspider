jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
var Scheduler = require('../scheduler3.js');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

describe("#initial instance", function() {
  it("# new()", function() {
    var scheduler = new Scheduler();
    expect(scheduler instanceof Scheduler).toBe(true);
    expect(scheduler instanceof EventEmitter).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('shift')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('pushNew')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('pushBad')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('pushFinished')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('check')).toBe(true);
    expect(Scheduler.prototype.hasOwnProperty('isDone')).toBe(true);
  });
});

describe("# test fn", function() {
  var scheduler = null;
  var opts;
  beforeAll(function() {
    opts = {
      start_url: 'www.baidu.com',
      maxRequest: 2,
      depth: 2
    }
    scheduler = new Scheduler(opts);
  });

  it('#initial', function() {
    expect(scheduler.start_url).toEqual('www.baidu.com');
    expect(scheduler.maxRequest).toBe(2);
    expect(scheduler.depth).toBe(2);
    expect(scheduler.project).toEqual(opts);
  })

  it("#check", function() {
    var state = scheduler.check()
    expect(state.q_todo).toEqual(['www.baidu.com']);
    expect(state.q_finished.length).toBe(0);
    expect(state.q_running.length).toBe(0);
    expect(state.project).toEqual(opts);
    expect(state.bad_urls).toEqual({});
    expect(state.urls_depth).toEqual({
      'www.baidu.com': 1
    })
  });

  it('#shift', function() {
    expect(scheduler.shift()).toEqual('www.baidu.com');
    expect(scheduler.q_running).toEqual(['www.baidu.com']);
    expect(scheduler.q_todo).toEqual([]);
  })

  it('#pushNew', function() {
    scheduler.on('newlink', function testPushNew(msg) {
      expect(msg).toBeUndefined();
      scheduler.removeAllListeners();
    })
    scheduler.pushNew(['www.qq.com'], 'www.baidu.com');
    expect(scheduler.q_todo).toEqual(['www.qq.com']);
    expect(scheduler.urls_depth).toEqual({
      'www.baidu.com': 1,
      'www.qq.com': 2
    });
  })

  it('#dropDuplicate', function() {
    scheduler.pushNew(['www.baidu.com'], 'www.baidu.com');
    expect(scheduler.q_todo).toEqual(['www.qq.com']);
    expect(scheduler.urls_depth).toEqual({
      'www.baidu.com': 1,
      'www.qq.com': 2
    });
  })

  it('#depth test', function() {
    scheduler.pushNew(['www.taobao.com'], 'www.qq.com');
    expect(scheduler.q_todo).toEqual(['www.qq.com']);
    expect(scheduler.urls_depth).toEqual({
      'www.baidu.com': 1,
      'www.qq.com': 2
    });
  })

  it('#pushFinished', function() {
    scheduler.pushFinished('www.baidu.com');
    expect(scheduler.q_finished).toEqual(['www.baidu.com']);
    expect(scheduler.q_running).toEqual([]);
  })

  it('#isDone false', function() {
    expect(scheduler.isDone()).toBe(false);
  })

  it('#pushBad', function() {
    scheduler.on('done', function testDone(remains) {
      expect(remains).toBeDefined();
      scheduler.removeAllListeners();
    })
    var url = scheduler.shift();
    expect(scheduler.q_running).toEqual([url]);
    scheduler.pushBad(url);
    expect(scheduler.bad_urls[url]).toBe(1);
    expect(scheduler.q_todo).toEqual([url]);
    url = scheduler.shift();
    scheduler.pushBad(url);
    expect(scheduler.bad_urls[url]).toBe(2);
    expect(scheduler.q_todo).toEqual([]);
    url = scheduler.shift();
  })

  it('#isDone true', function() {
    expect(scheduler.isDone()).toBe(true);
  })
});

describe("#额外测试", function() {
  var scheduler = null;
  var opts;
  beforeAll(function() {
    opts = {
      start_url: 'www.baidu.com',
      maxRequest: 2,
      depth: 2,
      domain: 'www.baidu.com'
    }
    scheduler = new Scheduler();
    scheduler.inject(opts);
  });

  it("#舍弃域名外地址", function() {
    it('#pushNew', function() {
      scheduler.pushNew(['www.qq.com'], 'www.baidu.com');
      expect(scheduler.q_todo).toEqual(['www.baidu.com']);
    })
  });
});
