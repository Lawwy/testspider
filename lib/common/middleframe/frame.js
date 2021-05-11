module.exports = Frame;

function Frame(fn) {
  this.preStack = [];
  this.postStack = [];
  this.errStack = [];
  this.main(fn);
}

var proto = Frame.prototype;

proto.main = function(fn) {
  if (typeof fn == 'function') {
    this.mainFn = fn;
  }
}

proto.pre = function(fn) {
  if (typeof fn == 'function' && fn.length == 2) {
    this.preStack.push(fn);
  }
}

proto.post = function(fn) {
  if (typeof fn == 'function' && fn.length == 2) {
    this.postStack.push(fn);
  }
}

proto.err = function(fn) {
  if (typeof fn == 'function' && fn.length === 3) {
    this.errStack.push(fn);
  }
}

proto.do = function(data, cb) {
  var self = this;
  cb = cb || finalHandle;
  var pres = self.preStack.slice(0);
  var posts = self.postStack.slice(0);
  if (self.mainFn) {
    pres.push(self.mainFn);
  }
  var stack = [].concat(pres, posts)
  var next = function(err) {
    if (err) {
      return self.doErr(err, data, cb);
    }
    var middleware = stack.shift();
    if (middleware) {
      middleware(data, next);
    } else {
      return cb(null, data);
    }
  }
  next();
}

proto.doErr = function(err, data, cb) {
  var stack = this.errStack.slice(0);
  var next = function() {
    var middleware = stack.shift();
    if (middleware) {
      middleware(err, data, next);
    } else {
      return cb(err, data);
    }
  }
  next();
}

function finalHandle(err, data) {
  // console.log(err);
  // console.log(data);
}
