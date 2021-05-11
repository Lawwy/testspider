// jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
var Frame = require('../frame.js');
var EventEmitter = require('events').EventEmitter;

describe('#initial instance', function() {
  it("# new()", function() {
    var frame = new Frame();
    expect(frame instanceof Frame).toBe(true);
    expect(frame instanceof EventEmitter).toBe(true);
    expect(Frame.prototype.hasOwnProperty('use')).toBe(true);
    expect(Frame.prototype.hasOwnProperty('pre')).toBe(true);
    expect(Frame.prototype.hasOwnProperty('post')).toBe(true);
    expect(Frame.prototype.hasOwnProperty('do')).toBe(true);
    frame = null;
  });

  it("# do", function() {
    var main = function(opt) {
      opt.main = 'main';
      return opt;
    }
    var preA = function(opt) {
      opt.A = 'preA'
      return opt;
    }
    var preB = function(opt) {
      opt.B = 'preB';
      return opt;
    }
    var postC = function(opt) {
      opt.C = 'postC';
      return opt;
    }
    var postD = function(opt) {
      opt.D = 'postD';
      return opt;
    }
    var frame = new Frame();
    frame.use(main);
    var r1 = frame.do({});
    expect(r1.main).toEqual('main');
    frame.pre(preA);
    frame.pre(preB);
    frame.post(postC);
    frame.post(postD);
    expect(frame.do({})).toEqual({
      A: 'preA',
      B: 'preB',
      main: 'main',
      C: 'postC',
      D: 'postD'
    })
  })
})
