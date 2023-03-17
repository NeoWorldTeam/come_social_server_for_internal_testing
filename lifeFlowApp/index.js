const path = require('path');
const Koa = require('koa')
const Router = require('koa-router')
const koaStatic = require('koa-static')
const koaBody = require('koa-body')


const querystring = require('querystringify')
const axios = require('axios')


const user_service = require('../lifeFlowApp/service/user_service.js')
const lobby_service = require('../lifeFlowApp/service/lobby_service.js')
const agora_service = require('../lifeFlowApp/service/agora_service.js');
const { set } = require('lodash');

const app = new Koa()
const router = new Router();

console.log(path.join(__dirname, 'public'))
// app.use(koaBodyParser())
// 加载index.html
app.use(koaStatic(path.join(__dirname, 'public')))
app.use(koaBody({
  // 支持文件格式
  multipart: true,
  formidable: {
      // 上传目录
      uploadDir: path.join(__dirname, 'public/uploads'),
      // 保留文件扩展名
      keepExtensions: true,
  }
}));





const error_back = function(code) {
  if(code > 0) code = -code
  return{"code":code}
}

const create_data = function(data) {
  if(data){
    return{"code":0,"data":data}
  }else{
    return{"code":0}
  } 
}

const checkParams = function(params) {
  if (params && params.trim() != ""){
    return {error:0, data:params}
  }else{
    return {error:10001}
  }
}

//10001 参数错误
//通过传递用户名登录
//同时过得自己的连接状态
router.get('/users/temp', async ctx => {
  console.log('GET /users/temp')
  const {userName} = ctx.query

  let {error:checkError,data:_userName} = checkParams(userName)
  if (checkError) {
    ctx.body = error_back(10001)
    return
  }

  let {error: userError,data: _userModel} = user_service.generateUser(userName)
  if (userError) {
    ctx.body = error_back(error)
    return
  }

  ctx.body = create_data(_userModel)
})

//连接其他用户
router.get('/users/:connectUserId', async ctx => {
  console.log('GET /users/:connectUserId')   
  const {userToken} = ctx.query
  const {connectUserId} = ctx.params

  let {error:checkError,data:_userToken} = checkParams(userToken)
  if (checkError) {
    ctx.body = error_back(10001)
    return
  }

  let {error:checkError2,data:_connectUserId} = checkParams(connectUserId) 
  if (checkError2) { 
    ctx.body = error_back(10001)
    return
  }

  var {error: queryError,data: _channelModel, timeStamp: _channelStateTimeStamp} = lobby_service.connectUser(userToken, _connectUserId)
  if (queryError) {
    ctx.body = error_back(queryError)
    return
  }

  let result = {channel:_channelModel, channelStateTimeStamp : _channelStateTimeStamp}
  var jsonString = JSON.stringify(result);
  console.log(jsonString);

  ctx.body = create_data(result)
})

//取消连接
router.get('/users/quitChannel', async ctx => {
  console.log('GET /users/quitChannel')   
  const {userToken} = ctx.query

  let {error:checkError,data:_userToken} = checkParams(userToken)
  if (checkError) {
    ctx.body = error_back(10001)
    return
  }


  var {error: queryError,data: _channelModel} = lobby_service.cancleConnect(userToken)
  if (queryError) {
    ctx.body = error_back(queryError)
    return
  }

  ctx.body = create_data(null)
})


//获取实时更新的状态
router.get('/realState', async ctx => {
  console.log('GET /realState')
  const {userToken} = ctx.query
  const {lifeFlowTimeStamp} = ctx.query
  const {channelTimeStamp} = ctx.query

  if (lifeFlowTimeStamp == null || lifeFlowTimeStamp == undefined) {
    ctx.body = error_back(10001)
    return
  }

  if (channelTimeStamp == null || channelTimeStamp == undefined) {
    ctx.body = error_back(10001)
    return
  }

  let {error:checkError,data:_userToken} = checkParams(userToken)
  if (checkError) {
    ctx.body = error_back(10001)
    return
  }

  const {error:checkError2,data:_nothing} = lobby_service.updateUserConnectState(userToken) 
  if (checkError2) {
    ctx.body = error_back(10001)
    return
  }

  var {error: queryError,data: _channelModel, timeStamp: _channelStateTimeStamp} = lobby_service.getChannelUpdate(userToken, channelTimeStamp)
  if (queryError) {
    ctx.body = error_back(queryError)
    return
  }
  
  var {error: queryError2,data: _lifeFlowModel, timeStamp: _lifeFlowTimeStamp} = lobby_service.getLifeFlowUpdate(userToken, lifeFlowTimeStamp)
  if (queryError2) {
    ctx.body = error_back(queryError2)
    return
  }

  let result = {channel:_channelModel, lifeFlow:_lifeFlowModel, channelStateTimeStamp : _channelStateTimeStamp, lifeFlowTimeStamp: _lifeFlowTimeStamp}
  //打印result
  var jsonString = JSON.stringify(result);
  print(jsonString);


  ctx.body = create_data(result)
})

//推送生活数据
router.post('/lifeFlows', async ctx => {
  console.log('POST /lifeFlows')
  var {userToken,data} = ctx.request.body

  let {error:checkError,data:_userToken} = checkParams(userToken)
  if (checkError) {
    ctx.body = error_back(10001)
    return
  }

  let {error:checkError2,data:_content} = checkParams(data)
  if (checkError2) {
    ctx.body = error_back(10001)
    return
  }

  var {error: queryError,data: _lifeFlowModel} = lobby_service.pushLifeFlow(userToken, _content)
  if (queryError) {
    ctx.body = error_back(queryError)
    return
  }

  ctx.body = create_data(null)
})





app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000, () => {
  console.log('listening port at 3000...')
})


let {data} = user_service.generateUser("test1")
console.log("userId:" + data.id)


//5秒一次 启动定时任务 更新频道状态 
function intervalFunc() {
  lobby_service.handleChannelState()
}

setInterval(intervalFunc, 5000);

//启动定时任务 处理生活流 1秒10次
function intervalFunc2() {
  lobby_service.handleLifeFlow()
}

setInterval(intervalFunc2, 100);