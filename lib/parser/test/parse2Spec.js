var rewire = require('rewire');
var parser = rewire('../parser.js');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');

describe("#parse test", function() {
  var html;
  var url;
  beforeAll(function() {
    html = fs.readFileSync(path.resolve('./lib/parser/test/data/content.html'));
    url = 'http://www.fruits.com';
    html = cheerio.load(html);
  });


  it("# select head", function() {
    var rule = {
      name: 'head',
      mode: 'css',
      expression: '.head'
    };
    rule.target = 'text';
    expect(parser.cssParse(html, rule)).toEqual('Fruit Sales');
    rule.target = 'html';
    expect(parser.cssParse(html, rule)).toEqual('<h1>Fruit Sales</h1>');
    rule.target = '@class';
    expect(parser.cssParse(html, rule)).toEqual('head');
  })

  it("# select apple tag", function() {
    var rule = {
      name: 'apple tags',
      mode: 'css',
      expression: '#apple .tag p',
      target: 'text'
    };
    expect(parser.cssParse(html, rule)).toEqual(["red", "sweet"]);
  })

  it("# select href", function() {
    var rule = {
      name: 'a',
      mode: 'css',
      type: 'link',
      expression: 'a',
      target: '@href'
    }
    var result = parser.cssParse(html, rule, url);
    expect(result).toEqual(["http://www.fruits.com/?query=apple", "http://www.fruits.com/?query=orange", "http://www.fruits.com/?query=pear"])
  });


  it("# select src", function() {
    //缺http头会测试失败
    var rule = {
      name: 'src',
      mode: 'css',
      type: 'link',
      expression: 'img',
      target: '@src'
    }
    var result = parser.cssParse(html, rule, url);
    expect(result).toEqual(["http://www.fruits.com/static/apple.png", "http://www.fruits.com/static/orange.png", "http://www.fruits.com/static/pear.png"])
  })

  it('# select compact collection', function() {
    var rule = {
      name: 'fruit',
      expression: '#fruits-list .item',
      mode: 'css',
      list: [{
        name: 'title',
        mode: 'css',
        expression: '.title',
        target: 'text'
      }, {
        name: 'link',
        mode: 'css',
        type: 'link',
        expression: 'a',
        target: '@href'
      }, {
        name: 'tags',
        mode: 'css',
        expression: '.tag p',
        target: 'text'
      }]
    }
    var result = parser.cssParse(html, rule, url);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({
      title: 'Apple',
      link: 'http://www.fruits.com/?query=apple',
      tags: ["red", "sweet"]
    })
  })

  it("#测试嵌套", function() {
    var rule = {
      name: 'fruit',
      expression: '#fruits-list .item',
      mode: 'css',
      list: [{
        name: 'title',
        mode: 'css',
        expression: '.title',
        target: 'text'
      }, {
        name: 'salepoint',
        expression: '.salePoint .point',
        mode: 'css',
        list: [{
          name: 'city',
          mode: 'css',
          expression: '.city',
          target: 'text'
        }, {
          name: 'distance',
          mode: 'css',
          expression: '.distance',
          target: 'text'
        }]
      }]
    }
    var result = parser.cssParse(html, rule, url);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({
      title: 'Apple',
      salepoint: [{
        city: 'LA',
        distance: '500'
      }, {
        city: 'Boston',
        distance: '200'
      }]
    })
  });
});
