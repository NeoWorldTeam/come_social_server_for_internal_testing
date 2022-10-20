const Koa = require('koa')
const Router = require('koa-router')
const static = require('koa-static')
const bodyParser = require('koa-bodyparser')

const querystring = require('querystring')
const axios = require('axios')
const user_service = require('./user_service')
const lobby_service = require('./lobby_service')
const spatial_anchor_service = require('./spatial_anchor_service')

// GitHub登录参数配置；配置授权应用生成的Client ID和Client Secret
const config = {
    client_id: 'xxxxxxxxxxxxxxxxxx',
    client_secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

const app = new Koa()
const router = new Router();


app.use(bodyParser())
// 加载index.html
app.use(static(__dirname + '/'))


// const users = [
//   {
//     id: 1,
//     name: 'tom'
//   },
//   {
//     id: 2,
//     name: 'jack'
//   }
// ]
// // 用户信息管理api实现query查询
// router.get('/users', (ctx, next) => {
//   console.log('GET /users')
//   const { name } = ctx.query // ?name=tom
//   // 从数据库中获取数据
//   let data = users
//   if (name) {
//     data = users.filter(u => u.name === name)
//   }
//   ctx.body = { ok: 1, data }
// })




// // 登录接口
// router.get('/github/login', async ctx => {
//   // 重定向到GitHub认证接口，并配置参数
//   let path = 'https://github.com/login/oauth/authorize?client_id=' + config.client_id
//   // 转发到授权服务器
//   ctx.redirect(path)
// })



// // GitHub授权登录成功回调，地址必须与GitHub配置的回调地址一致
// router.get('/github/callback', async ctx => {
//   console.log('callback...')

//   // 服务器认证成功，回调带回认证状态code
//   const code = ctx.query.code
//   const params = {
//     client_id: config.client_id,
//     client_secret: config.client_secret,
//     code: code
//   }

//   // 申请令牌token
//   let res = await axios.post('https://github.com/login/oauth/access_token', params)
//   const access_token = querystring.parse(res.data).access_token

//   // 根据token获取用户信息
//   // 旧版本
//   // res = await axios.get('https://api.github.com/user?access_token=' + access_token)
//   // 新版本 官方推荐的使用access_token安全访问API的方式，用Authorization HTTP header代替query parameter，旧方式将被废弃
//   res = await axios.get(`https://api.github.com/user`, {
//     headers: {
//       'Authorization': 'token ' + access_token
//     }
//   })

//   // 渲染页面
//   ctx.body = `
//     <h1>Hello ${res.data.login}</h1>
//     <img src="${res.data.avatar_url}" alt="">
//   `
// })



// 登录接口
router.get('/discord/login', async ctx => {
  let path = 'https://discord.com/api/oauth2/authorize?client_id=1019792433661349918&redirect_uri=http%3A%2F%2Fr9v04sg7r2k4.ngrok.xiaomiqiu123.top%2Fdiscord%2Fcallback&response_type=code&scope=identify'
  // 转发到授权服务器
  ctx.redirect(path)
})

router.get('/discord/callback', async ctx => {
  console.log('callback...')

  // 服务器认证成功，回调带回认证状态code
  const code = ctx.query.code
  const params = {
    client_id: '1019792433661349918',
    client_secret: 'M0ZmltlMq6yPi15HS2hZ5NJrDu4jOxnq',
    grant_type: 'authorization_code',
    redirect_uri:'http://r9v04sg7r2k4.ngrok.xiaomiqiu123.top/discord/callback',
    code: code
  }

  console.log('code is ' + code)

  // 申请令牌token
  let res = await axios.post('https://discordapp.com/api/oauth2/token', params)
  const access_token = querystring.parse(res.data).access_token

  // 根据token获取用户信息
  // 旧版本
  // res = await axios.get('https://api.github.com/user?access_token=' + access_token)
  // 新版本 官方推荐的使用access_token安全访问API的方式，用Authorization HTTP header代替query parameter，旧方式将被废弃
  res = await axios.get(`https://discordapp.com/api/users/@me`, {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  })

  // 渲染页面
  ctx.body = `
    <h1>Hello ${res.data.login}</h1>
    <img src="${res.data.avatar_url}" alt="">
  `
})


// 临时账号
router.get('/user/temp', async ctx => {
  console.log('GET /user/temp')
  const {userName} = ctx.query
  console.log(ctx.query)
  let user = user_service.generateUser(userName)
  ctx.body = user
})




router.get('/lobby', async ctx => {
  console.log('GET /lobby')
  let lobbyList = lobby_service.lobbyList()
  ctx.body = lobbyList
})

router.get('/lobby/:id', (ctx, next) => {
  console.log('GET /lobby/:id')
  const { id } = ctx.params 
  console.log(id)
  const data = lobby_service.getLobby(id)
  ctx.body = data
})

//创建
router.post('/lobby', (ctx, next) => {
  console.log('POST /lobby')
  var user = JSON.parse(ctx.request.body.user)
  var lobbyName = ctx.request.body.lobbyName
  if(user != null && lobbyName != null){
    var lobbyObj = lobby_service.createLobby(user,lobbyName)
    if(lobbyObj != null){
      // console.log(JSON.stringify(lobbyObj))
      ctx.body = lobbyObj
      return
    }
  }

  ctx.body = {}
})

//加入
router.post('/lobby/:id', (ctx, next) => {
  console.log('POST /lobby/:id')
  var user = JSON.parse(ctx.request.body.user)
  const { id } = ctx.params 
  console.log(id)
  if(user != null && id != null){
    var lobby = lobby_service.JoinLobby(user,id)
    ctx.body = lobby
    return
  }
  
  ctx.body = data
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




app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000, () => {
  console.log('listening port at 3000...')
})