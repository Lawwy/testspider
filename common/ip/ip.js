var os = require('os');
var ip = function() {
  var network = os.networkInterfaces();
  for (var i = 0; i < network.en1.length; i++) {
    var json = network.en1[i];
    if (json.family == 'IPv4') {
      return json.address;
    }
  }
}
module.exports = ip;
