# runner

## 接口

### start
* 描述:启动项目
* 接口地址:`/start`
* 方法:`POST`
* 参数:`项目模版配置文件(JSON格式)`
* 返回值:
  ```
  {
    success:true,  //或false
    message:'some message'
  }
  ```

### stop
* 描述:停止项目
* 接口地址:`/stop`
* 方法:`POST`
* 参数:`项目id(JSON格式),如{id:'1'}`
* 返回值:
  ```
  {
    success:true,           //或false
    message:'some message',
    q_todo:['url1'],        //项目停止时待爬url
    q_finished:['url2'],    //已完成url
    q_running:['url3'],     //正在爬取的url
    bad_urls:{              //坏链接，key为url,value为该url请求失败次数
      'url4':3
    },
    project:{...}           //项目模版配置文件
  }
  ```

### check
* 描述:检查runner资源情况
* 接口地址:`/check`
* 方法:`GET`
* 参数:`无`
* 返回值:
  ```
  {
  "total": 5, 	               //共有爬虫数目
  "free": 4,                   //空闲爬虫数目
  "pid": "192.168.67.234:3034" //runner服务地址
}
  ```

### 项目模版配置文件
```
{
  "id":"1",                           //项目id
  "name":"segmentProject",            //项目名称
  "depth":1,                          //抓取深度
  "start_url":"https://segmentfault.com", //入口url
  "rule_store":[{                     //页面模版集合
    "url_pattern":[
      "https://segmentfault.com.*?"   //页面url模式     
    ],
    "link_parse_rule":[{              //页面链接提取规则
      "mode":"reg",
      "expression":"href=\"(https://github.com.*?)\""
      }],
    "content_parse_rule":[{           //内容提取规则(未完全确定)
        "name": 'fruit',
        "mode": 'css',
        "expression": '#fruits-list .item',
        "isGroup": true,
        "list": [{
          "name": 'title',
          "mode": 'css',
          "expression": '.title',
          "target": 'text',
        },{
          "name": 'link',
          "mode": 'css',
          "expression": '.link a',
          "target": '@href',
          "type": 'link'
        }]
    }]
    }]
}
```

### 服务依赖
* nats队列服务:queue_service

### nats通信队列名
* runnerManager->runner
  * 启动任务队列:`start_queue`
  * 停止任务队列:`stop_queue`
  * 请求资源:`update_request`

* runner->runnerManager
  * 资源更新汇报:`runner_update`
  * 死亡通知:`runner_death`

* runner->scheduler
  * 爬虫完成通知:`spider_done`

* runnerManager->scheduler
  * 汇总资源:`Resource_Update`

* scheduler->runnerManager
  * 资源请求:`manager_update`
