const path = require('path');
const Koa = require('koa')
const Router = require('koa-router')
const koaStatic = require('koa-static')
// const koaBodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')


const querystring = require('querystringify')
const axios = require('axios')


const user_service = require('../app/service/user_service.js')
const lobby_service = require('../app/service/lobby_service')
const cards_service = require('../app/service/cards_service')
const nft_service = require('../app/service/nft_service')
const discord_service = require('../app/service/discord_service')
const spatial_anchor_service = require('../app/service/spatial_anchor_service')
const agora_service = require('../app/service/agora_service.js')

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

//10001 参数错误
// 临时账号
router.get('/users/temp', async ctx => {
  console.log('GET /users/temp')
  const {userName} = ctx.query
  if (userName && userName.trim() != ""){
    let {error,data} = user_service.generateUser(userName)
    if(error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

// 查询用户信息
//10002 token 无效
router.get('/users', async ctx => {
  console.log('GET /users')
  const {userToken,queryUserId} = ctx.query
  if (userToken && userToken.trim() != "" && queryUserId && queryUserId.trim() != ''){
    let {error,data} = user_service.getUser(userToken,queryUserId)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})


// 查询当前场的声网信息
router.get('/fields/:id/agora', async ctx => {
  console.log('GET /fields/:id/agora')
  const {userToken} = ctx.query
  const {id} = ctx.params
  if (userToken && userToken.trim() != "" && id && id.trim() != "" ){

    //get user
    let {error: userError,data:userModel} = user_service.getUser(userToken)
    if (userError) {
      ctx.body = error_back(userError)
      return 
    }

    //get field
    let {error: fieldError,data:fieldModel} = lobby_service.getLobby(userToken,id)
    if(fieldError) {
      ctx.body = error_back(fieldError)
      return 
    }

    //get agora id
    let {error: agoraError,data:{agoraId}} = agora_service.getUserAgoraId(userModel.id)
    if (agoraError) {
      ctx.body = error_back(agoraError)
      return 
    }

    //get agora token 
    let {error: rtcError,data:{rtcToken}} = agora_service.generateRTCToken(fieldModel.id, agoraId, "publisher")
    if(rtcError){
      ctx.body = error_back(agoraError)
      return 
    }

    let result = {agoraId: agoraId,channelName: fieldModel.name, token: rtcToken}
    ctx.body = create_data(result)
  }else{
    ctx.body = error_back(10001)
  }
})

//轮询 同步场的状态
//同步自身在线状态
//同步其他用户在线状态
//同步 tick
router.get('/fields/:id/players', (ctx, next) => {
  console.log('GET /fields/:id/players')
  const {userToken,timeStamp} = ctx.query
  const {id} = ctx.params

  if (userToken && userToken.trim() != "" && id && id.trim() != "" && timeStamp && timeStamp.trim() != ""){
    let timeStampInMileSce = parseInt(timeStamp, 10)
    let {error,data} = lobby_service.pullFieldState(userToken,id,timeStampInMileSce)
    if(error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})



//发送数据
router.post('/fields/:id/messages', async ctx => {
  console.log('POST /fields/:id/messages')
  var {userToken,content,target} = ctx.request.body
  const { id } = ctx.params 
  if(userToken && userToken != ""){
    if (target == "all") {
      let {error,data} = lobby_service.sendMessageToAll(userToken,id,content)
      if(error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }else {
      var targetId = parseInt(target);
      let {error,data} = lobby_service.sendMessageToOne(userToken,id,content,targetId)
      if(error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }
    
  }else{
    ctx.body = error_back(10001)
  }
})


//获取场列表
router.get('/fields', async ctx => {
  console.log('GET /fields')
  const {userToken,page,numPerPage} = ctx.query
  if (userToken && userToken.trim() != ""){
    let {error,data} = lobby_service.lobbyList(userToken,page,numPerPage)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

//获取场的信息
//10004 操作的对象不存在
router.get('/fields/:id', async ctx => {
  console.log('GET /fields/:id')
  const {userToken} = ctx.query
  const {id} = ctx.params
  if (userToken && userToken.trim() != ""){
    let {error,data} = lobby_service.getLobby(userToken,id)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})


//创建场
router.post('/fields', (ctx, next) => {
  console.log('POST /fields')
  const {userToken,name,type} = ctx.query
  if (userToken && userToken.trim() != "" && name && name.trim() != ""){
    let {error,data} = lobby_service.createLobby(userToken,name,type)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

//10005 无权限
//删除
router.delete('/fields/:id', (ctx, next) => {
  console.log('DELETE /fields')
  const {userToken} = ctx.query
  const {id} = ctx.params

  // var lobbyId = ctx.request.body.lobbyId
  if(userToken && userToken.trim() != "" && id && id.trim() != ""){
    let {error,data} = lobby_service.closeLobby(userToken,id)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})


//加入场
router.put('/fields/:id/numbers', (ctx, next) => {
  console.log('PUT /fields/:id/numbers')
  const {userToken} = ctx.request.body
  const {id} = ctx.params

  if(userToken && userToken.trim() != "" && id && id.trim() != ""){
    let {error,data} = lobby_service.JoinField(userToken,id)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

//退出场
router.delete('/fields/:id/numbers', (ctx, next) => {
  console.log('Delete /fields/:id/numbers')
  const {userToken,leaveUserId} = ctx.query
  const {id} = ctx.params

  if(userToken && userToken.trim() != "" && id && id.trim() != ""){
    if(leaveUserId){
      let {error,data} = lobby_service.UpdateOthersQuitLobby(userToken,id,leaveUserId)
      if (error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }else{
      let {error,data} = lobby_service.QuitLobby(userToken,id)
      if (error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }
  }else{
    ctx.body = error_back(10001)
  }
})



//获取卡列表
router.get('/cards', async ctx => {
  console.log('Get /cards')
  const {userToken,page,numPerPage} = ctx.query
  if (userToken && userToken.trim() != ""){
    let {error,data} = cards_service.cardList(userToken,page,numPerPage)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})


//删除卡
router.delete('/cards/:id', async ctx => {
  console.log('Delete /cards/:id')
  const {userToken} = ctx.query
  const {id} = ctx.params
  if (userToken && userToken.trim() != "" && id && id.trim() != ""){
    let {error,data} = cards_service.deleteCard(userToken,id)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

//10006 操作不允许
//赠送卡
router.put('/cards/:id', async ctx => {
  console.log('Put /cards/:id')
  const {userToken,receiveUserId} = ctx.query
  const {id} = ctx.params
  if (userToken && userToken.trim() != "" && receiveUserId && receiveUserId.trim() != "" && id && id.trim() != ""){
    let {error,data} = cards_service.presentCard(userToken,id,receiveUserId)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})

//铸造NFT卡
router.post('/cards/nft', async ctx => {
    var {userToken,chain_address,name} = ctx.request.body
    const {metadata} = ctx.request.files
    if(userToken && userToken != "" && metadata){
      const basename = path.basename(metadata.path)
      // const metadataUrl = `${ctx.origin}/uploads/${basename}`
      const domainUrl = ctx.origin

      if(!chain_address) chain_address = "0x207be40d18bF12E42A2427C106c1F9198D9A8CC5"
      let {error,data} = nft_service.generateNFT(userToken,chain_address,domainUrl,metadata.path,name)
      if (error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }else{
      ctx.body = error_back(10001)
    }
})

//查询NFT卡进度
router.get('/card/nft/progress', async ctx => {
  var {userToken,makeNFTId} = ctx.query
  if(userToken && userToken.trim() != "" && makeNFTId && makeNFTId.trim() != ""){
  
    let {error,data} = nft_service.queryMakeNFT(userToken,makeNFTId)
    if (error) {
      ctx.body = error_back(error)
    }else{
      ctx.body = create_data(data)
    }
  }else{
    ctx.body = error_back(10001)
  }
})


// 登录接口
router.get('/discord/login', async ctx => {
  let path = 'https://discord.com/api/oauth2/authorize?client_id=1006005005066715257&permissions=8&redirect_uri=http%3A%2F%2F45.32.32.246%3A3000%2Fdiscord%2Fcallback&response_type=code&scope=identify%20bot'
  // 转发到授权服务器
  ctx.redirect(path)
})

router.get('/discord/callback', async ctx => {
  console.log('callback...')

  // 服务器认证成功，回调带回认证状态code
  const {code,state} = ctx.query
  const params = {
    client_id: '1006005005066715257',
    client_secret: 'IwViKo5eYRaV0tgwbmmrCcr_GzcT881I',
    grant_type: 'authorization_code',
    redirect_uri:'http://45.32.32.246:3000/discord/callback',
    code: code
  }

  console.log('code is ' + code)
  console.log('state is ' + state)

  // 申请令牌token
  let res = await axios.post('https://discord.com/api/oauth2/token', querystring.stringify(params))
  console.log('res is ' + res)

  const {access_token,token_type,expires_in,refresh_token,scope} = res.data



  // const access_token = querystring.parse(res.data).access_token
  console.log('access_token is ' + access_token)

  // 根据token获取用户信息
  // 旧版本
  // res = await axios.get('https://api.github.com/user?access_token=' + access_token)
  // 新版本 官方推荐的使用access_token安全访问API的方式，用Authorization HTTP header代替query parameter，旧方式将被废弃
  res = await axios.get(`https://discord.com/api/v10/users/@me`, {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  })

  let {id,username,avatar} = res.data

  // 渲染页面
  ctx.body = `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset=" utf-8">
  <script type="text/javascript">
  window.onload = function runoob(){
      window.webkit.messageHandlers.toggleMessageHandler.postMessage("${username}");
  }
  </script>
  </head>
  <body>
  </body>
  </html>
  `
})



//查询anchor
router.get('/lobby/:id/anchors', (ctx, next) => {
  console.log('GET /lobby/:id/anchors')
  const { id } = ctx.params 
  console.log('id:',id)
  var ret = []
  if(id != null){
    ret = spatial_anchor_service.getSpatialAnchor(id)
  }
  
  ctx.body = ret
})


//增加anchor
router.post('/lobby/:id/anchors', (ctx, next) => {
  console.log('POST /lobby/:id/anchors')
  var anchorId = ctx.request.body.anchorId
  const { id } = ctx.params 
  console.log('id:',id,'anchorId:',anchorId)
  var ret = []
  if(anchorId != null && id != null){
    ret = spatial_anchor_service.addSpatialAnchor(id,anchorId)
  }
  ctx.body = ret
})

//删除anchor
router.delete('/lobby/:id/anchors', (ctx, next) => {
  console.log('POST /lobby/:id/anchors')
  var anchorId = ctx.request.body.anchorId
  const { id } = ctx.params 
  console.log('id:',id,'anchorId:',anchorId)
  var ret = []
  if(anchorId != null && id != null){
    ret = spatial_anchor_service.deleteSpatialAnchor(id,anchorId)
  }
  ctx.body = ret
})



router.post('/links/discord', (ctx, next) => {
  console.log('POST /links/discord')
  var {userToken,appURLScheme,title} = ctx.query
    if(userToken && userToken != "" && appURLScheme && appURLScheme != ""){
      let {error,data} = discord_service.sendRequestToDiscord(userToken,appURLScheme)
      if (error) {
        ctx.body = error_back(error)
      }else{
        ctx.body = create_data(data)
      }
    }else{
      ctx.body = error_back(10001)
    }
})

router.get('/links/comesocial', (ctx, next) => {
  console.log('GET /links/comesocial')
  var {tempLink} = ctx.query
    if(tempLink && tempLink != "" ){
      let {error,data} = discord_service.getAppURLSchemeFromDiscord(tempLink)
      if (error) {
        ctx.body = error_back(error)
      }else{
        let {appUrlScheme,downloadUrl} = data
        console.log("appUrlScheme:"+appUrlScheme)
        // 渲染页面
        ctx.body = `
        <span id="open-comesocial">打开ComeSocial</span>
        <script>
        window.onload = function(){
          window.location.href = '${appUrlScheme}';
            setTimeout(function() {
                window.location.href = '${downloadUrl}';
            }, 3000);
        }
        </script>
        `
      }
    }else{
      ctx.body = error_back(10001)
    }
})







app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000, () => {
  console.log('listening port at 3000...')
})

//init data
let {error,data} = user_service.generateUser("你好")
if(!error) {
  let {data:feildModel } = lobby_service.createLobby(data.token,"默认场",1)
  if(feildModel){
    console.log("id:",feildModel.id)
  }
}




function intervalFunc() {
  lobby_service.UpdatePlayerOnlineState()
}

setInterval(intervalFunc, 1000);