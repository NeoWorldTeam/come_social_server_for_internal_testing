const { v4: uuidv4 } = require('uuid')
const agora_service = require('./agora_service.js')
const redisStore = require('../utils/redis');

//用户缓存
const userTable = []
//用户token缓存
const userTokenCache = {}




//create user 
module.exports.generateUser = function(userName) { 
    let userToken = "token_"+uuidv4()
    var userObj = null

    do {
        if (userName != null) {
            userObj = userTable.find(o => o.name === userName)
            if (userObj) break
        }


        //create user model
        let userId = uuidv4()
        let { error, data: {agoraId}} = agora_service.generateAgoraId(userId)
        var userObj = {"id":userId,"name":userName,"agoraId": agoraId}
        userTable.push(userObj)
        
    }while(false)

    //update user token
    userTokenCache[userToken] = userObj

    //copy user
    let result = Object.assign({}, userObj)
    result.token = userToken
    return {error: 0, data: result}
}


//查询用户
module.exports.getUser = function(token,userId) { 
    let currentUser = userTokenCache[token]
    if (currentUser) {
        if(userId){
            let findUser = userTable.find(o => o.id === userId)
            if(findUser){
                let userObj = Object.assign({}, findUser)
                return {error: 0, data: userObj}
            }else{
                return {error: 10004, data: null}
            }
        }else{
            let userObj = Object.assign({}, currentUser)
            return {error: 0, data: userObj}
        }
    }
    return {error: 10002, data: null}
}



