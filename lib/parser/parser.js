var _ = require('underscore');
var cheerio = require('cheerio');
var urlHelper = require('url');

module.exports = {
  linkparse: parse,
  contentparse: parse,
  cssParse: cssParse,
  parse: parse
};

/*
@params {string} page:html string,
@params {Array} rules:link parse rule,
@params {string} url:the page url
*/

function regParse(page, rule, url) {
  var rs = [];
  if (rule.mode != 'reg')
    return;
  var reg = new RegExp(rule.expression, 'g');
  var res;
  var index = rule.target || 0;
  while (res = reg.exec(page)) {
    rs.push(res[index]);
  }
  rs = _.uniq(rs);
  if (rule.type == 'link') {
    rs = rs.map(function(l) {
      return transferLink(url, l);
    })
  // rs = transferLinks(rs, url);
  }
  return rs
}

//new
function transferLink(parUrl, link) {
  try {
    if (parUrl instanceof urlHelper.Url == false) {
      parUrl = urlHelper.parse(parUrl, true, true);
    }
    var tUrl = urlHelper.parse(link, true, true);
    tUrl.protocol = tUrl.protocol || parUrl.protocol || '';
    tUrl.host = tUrl.host || parUrl.host || '';
    tUrl.pathname = tUrl.pathname || parUrl.pathname || '';
    tUrl.search = tUrl.search || '';
    return urlHelper.format(tUrl);
  } catch (e) {
    console.log(e);
    return link;
  }
}

function parse(html, rules, url) {
  var $ = cheerio.load(html);
  var rs = [];
  rules.forEach(function(rule) {
    switch (rule.mode) {
      case 'css':
        rs.push({
          rule: rule,
          result: cssParse($, rule, url)
        });
        break;
      case 'reg':
        rs.push({
          rule: rule,
          result: regParse(html, rule, url)
        })
        break;
      default:
        rs.push({
          rule: rule,
          result: []
        })
        break;
    }
  })
  return rs;
}

function cssParse($, rule, url, root) {
  var eles;
  if (rule.expression) {
    eles = $(rule.expression, root);
  } else {
    eles = root;
  }
  if (!eles)
    return '';
  var pick = parseTarget(rule.target);
  var result;
  //QUESTION:是否需要isGroup标明
  // if (eles.length > 1) {
  var result = [];
  for (var i = 0; i < eles.length; i++) {
    var el = $(eles[i]);
    var atom;
    if (pick) {
      atom = getAttr(el, pick);
      if (rule.type == 'link') {
        atom = transferLink(url, atom);
      }
    }
    if (!pick && rule.list && rule.list.length) {
      atom = {};
      rule.list.forEach(function(r) {
        atom[r.name] = cssParse($, r, url, el);
      })
    }
    //单个结果返回单个对象
    if (eles.length == 1) {
      return atom;
    }
    result.push(atom)
  }
  return result.length ? result : '';
}

function parseTarget(target) {
  if (!target) {
    return null;
  }
  var isAttr = target.indexOf('@') > -1;
  var attrName = isAttr ? target.slice(1) : target;
  return {
    isAttr: isAttr,
    attrName: attrName
  }
}

//TODO:选多个属性的情况？
function getAttr(el, pick) {
  if (pick.isAttr) {
    return el.attr(pick.attrName);
  }
  if (!pick.isAttr && pick.attrName == 'text') {
    return el.text();
  }
  if (!pick.isAttr && pick.attrName == 'html') {
    return el.html();
  }
  return '';
}
