var rewire = require('rewire');
var runner = rewire('../runner.js');
var projList = require('./data/project.json');

describe("# getState", function() {

  it("# when", function() {
    runner.__set__('limit', 2);
    runner.__set__('self_address', 'localhost')
    var state = runner.getState();
    expect(state.total).toBe(2);
    expect(state.free).toBe(2);
    expect(state.pid).toBeDefined();
  });

  it("# create", function(done) {
    var p = projList[0];
    runner.create(p, function(e, result) {
      expect(e).toBeNull();
      expect(result).toBe(true);
      var state = runner.getState();
      expect(state.total).toBe(2);
      expect(state.free).toBe(1);
      runner.stop(p, function(e, result) {
        var state = runner.getState();
        expect(state.total).toBe(2);
        expect(state.free).toBe(2);
        done();
      })
    })
  })

  it("# stop", function(done) {
    var p = projList[1];
    runner.stop(p, function(e, result) {
      expect(e).toBeDefined();
      expect(e.message).toEqual('No this project');
      done();
    })
  })

  it("# create with no spider", function(done) {
    var p = projList[0];
    runner.__set__('limit', 0);
    runner.create(p, function(e, result) {
      expect(e).toBeDefined();
      expect(e.message).toEqual('No Spiders');
      done();
    })
  })
});
