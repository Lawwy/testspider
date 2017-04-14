var factory = require('../factory.js');

xdescribe("pre", function() {
  it('when no service', function(done) {
    factory.queue = 'hello_service';
    factory.create('1234').then(function(instance) {
      expect(instance).toBeUndefined();
      done();
    }).catch(function(e) {
      expect(e.message).toEqual('No such service');
      factory.queue = 'queue_service';
      done();
    })
  })
});

describe("test", function() {
  it("get when not exist", function() {
    var instance = factory.get('1234');
    expect(instance).toBeUndefined();
  });

  it("create", function(done) {
    factory.create('1234')
      .then(function(instance) {
        expect(instance.constructor.name).toEqual("scheduler");
        expect(instance.queue_service).toEqual("nats://192.168.67.242:4222");
        done();
      })
      .catch(function(e) {
        expect(e).toBeNull();
        done();
      })
  });

  it("create fail", function(done) {
    factory.create('123dsfas')
      .then(function(instance) {
        done();
      })
      .catch(function(e) {
        expect(e.message).toBe('no such project');
        done();
      })
  });

  it("get when exists", function(done) {
    var instance = factory.get('1234');
    expect(instance).not.toBeUndefined();
    expect(instance.constructor.name).toEqual("scheduler");
    done();
  });
});
