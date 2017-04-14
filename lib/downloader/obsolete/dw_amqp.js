var amqp = require('amqplib/callback_api');
var fs = require('fs');
var dw = require('./index.js');

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var tq = 'task_queue';
    var sq = 'save_queue';
    ch.assertQueue(tq, {durable: true});
    ch.assertQueue(sq, {durable: true});
    ch.prefetch(1);
    console.log(" [*] Waiting for tasks in %s. To exit press CTRL+C", tq);
    ch.consume(tq, function(msg) {
      var task = JSON.parse(msg.content.toString());
      console.log(" [x] Received %s",task.url);
      downloader(task,function(err,page) {
        if(err){
          console.log('request fail,resend the task');
          ch.sendToQueue(tq,msg,{persistent:true});
        }else{
          console.log('request success');
          save(page,function(e,filepath) {
            if(e){
              console.log('save fail,resend the task');
              ch.sendToQueue(tq,msg,{persistent:true});
            }else{
              var saved_msg = {
                url:task.url,
                path:filepath
              }
              ch.sendToQueue(sq,
                new Buffer(JSON.stringify(saved_msg)),
                {persistent:true});
              ch.ack(msg);
            }
          })
        }
      })
    }, {noAck: false});
  });
});

function downloader(task,cb) {
  var download = dw(task.isDynamic);
  console.log('**** start to download '+task.url);
  return download(task,cb);
}

var save_path = __dirname +'/html/';

function save(page,cb) {
  var name = save_path+'html_'+new Date().toString()+'.html';
  console.log('****** save '+name);
  fs.writeFile(name,page,function(e) {
    if(e){
      return cb(e);
    }
    else{
      return cb(null,name);
    }
  })
}
