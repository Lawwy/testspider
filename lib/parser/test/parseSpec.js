var rewire = require('rewire');
var parser = rewire('../parser.js');
var fs = require('fs');
var path = require('path');

describe("#linkparse test", function() {
  var html;
  beforeAll(function() {
    html = fs.readFileSync(path.resolve('./lib/parser/test/data/links.html'));
  });
  it("#css select test", function() {
    var rules = [{
      name: 'a',
      mode: 'css',
      type: 'link',
      expression: 'a',
      target: '@href'
    }, {
      name: 'img',
      mode: 'css',
      type: 'link',
      expression: 'img',
      target: '@src'
    }];
    var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
    var page = html;
    var result = parser.linkparse(page, rules, url);
    expect(result.length).toBe(2);
    expect(result[0].result.length).toBe(4);
    expect(result[0].result).toEqual([
      'http://s.wanfangdata.com.cn/Paper.aspx?page=1',
      'http://s.wanfangdata.com.cn/Paper.aspx?page=2',
      'http://www.baidu.com/',
      'http://www.qq.com/',
    ])
    expect(result[1].result.length).toBe(2);
    expect(result[1].result).toEqual([
      'http://s.wanfangdata.com.cn/static/png2.jpg',
      'http://www.qq.com/static/qq.jpg'
    ])
  });

  it("#css select test2", function() {
    var rules = [{
      name: 'a',
      mode: 'css',
      type: 'link',
      expression: '.pager a',
      target: '@href'
    }];
    var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
    var page = html;
    var result = parser.linkparse(page, rules, url);
    expect(result.length).toBe(1);
    expect(result[0].result.length).toBe(2);
    expect(result[0].result).toEqual([
      'http://s.wanfangdata.com.cn/Paper.aspx?page=1',
      'http://s.wanfangdata.com.cn/Paper.aspx?page=2'
    ])
  });

  it("#reg select test", function() {
    var rules = [{
      name: 'reg a',
      mode: 'reg',
      type: 'link',
      expression: '(href|src)=\"(.*?)\"',
      target: 2
    }];
    var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
    var page = html;
    var result = parser.linkparse(page, rules, url);
    expect(result.length).toBe(1);
    expect(result[0].result.length).toBe(6);
    expect(result[0].result).toEqual([
      'http://s.wanfangdata.com.cn/Paper.aspx?page=1',
      'http://s.wanfangdata.com.cn/Paper.aspx?page=2',
      'http://s.wanfangdata.com.cn/static/png2.jpg',
      'http://www.baidu.com/',
      'http://www.qq.com/',
      'http://www.qq.com/static/qq.jpg'
    ])
  })

  describe('# err handle', function() {
    it('#no match', function() {
      var rules = [{
        name: 'reg a',
        mode: 'reg',
        type: 'link',
        expression: 'jslenkdte',
      }];
      var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
      var page = html;
      var result = parser.linkparse(page, rules, url);
      expect(result.length).toBe(1);
      expect(result[0].result.length).toBe(0);
    });

    it('#unknown mode', function() {
      var rules = [{
        name: 'reg a',
        mode: 'hello',
        type: 'link',
        expression: 'jslenkdte',
      }];
      var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
      var page = html;
      var result = parser.linkparse(page, rules, url);
      expect(result.length).toBe(1);
      expect(result[0].result.length).toBe(0);
    });

  })
});

describe("#contentparse test", function() {
  var html;
  beforeAll(function() {
    html = fs.readFileSync(path.resolve('./lib/parser/test/data/content.html'))
  });
  it("# content select test1", function() {
    var rules = [{
      name: 'fruit',
      mode: 'css',
      expression: '#fruits-list .item',
      isGroup: true,
      list: [{
        name: 'title',
        mode: 'css',
        expression: '.title',
        target: 'text',
      }, {
        name: 'price',
        mode: 'css',
        expression: '.price',
        target: 'text',
      }, {
        name: 'link',
        mode: 'css',
        expression: '.link a',
        target: '@href',
        type: 'link'
      }]
    }]
    var url = 'www.fruits.com';
    var page = html;
    var result = parser.contentparse(page, rules, url);
    expect(result.length).toBe(1);
    expect(result[0].result.length).toBe(3);
    expect(result[0].result).toEqual([
      {
        title: 'Apple',
        price: '1$',
        link: 'www.fruits.com?query=apple'
      }, {
        title: 'Orange',
        price: '2$',
        link: 'www.fruits.com?query=orange'
      }, {
        title: 'Pear',
        price: '3$',
        link: 'www.fruits.com?query=pear'
      }
    ])
  });
});


describe("#wf linkparse test", function() {
  var html;
  beforeAll(function() {
    html = fs.readFileSync(path.resolve('./lib/parser/test/data/wf.html'));
  });
  it("#reg select test", function() {
    var rules = [{
      "mode": "css",
      "type": "link",
      "expression": ".pager a",
      "target": '@href'
    }];
    var url = 'http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top';
    var page = html;
    var result = parser.linkparse(page, rules, url);
    expect(result.length).toBe(1);
    expect(result[0].result.length).toBe(5);
  });
})

describe("#wf contentparse test", function() {
  var html;
  beforeAll(function() {
    html = fs.readFileSync(path.resolve('./lib/parser/test/data/wf.html'))
  });
  it("# content select test1", function() {
    var rules = [{
      "name": "record",
      "mode": "css",
      "expression": ".record-item-list .record-item",
      "isGroup": true,
      "list": [{
        "name": "title",
        "mode": "css",
        "expression": ".record-title .title",
        "target": "text"
      },
        {
          "name": "description",
          "mode": "css",
          "expression": ".record-desc",
          "target": "text"
        },
        {
          "name": "link",
          "mode": "css",
          "expression": ".record-title .title",
          "target": "@href",
          "type": "link"
        }]
    }]
    var url = "http://s.wanfangdata.com.cn/Paper.aspx?q=docker&f=top&p=1";
    var page = html;
    var result = parser.contentparse(page, rules, url);
    expect(result.length).toBe(1);
    expect(result[0].result.length).toBe(10);

  });
});
