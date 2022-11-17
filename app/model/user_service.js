const { v4: uuidv4 } = require('uuid')

//用户缓存
const userTable = []

//用户token缓存
const userTokenCache = {}

//用户声网缓存
const userAograCahce = {}

//声网分配ID
var userAgoraIdIndex = 10

//生成账户
module.exports.generateUser = function(userName) { 
    let userToken = uuidv4()
    var userObj = null

    do {
        if (userName != null) {
            userObj = userTable.find(o => o.name === userName)
            if (userObj) break
        }


        //创建User
        var userObj = {"id":uuidv4(),"name":userName}
        userTable.push(userObj)
        userAograCahce[userObj.id] = userAgoraIdIndex++
    }while(false)

    let result = Object.assign({}, userObj)
    userTokenCache[userToken] = userObj
    result.token = userToken
    return result
}

//获取用户声网信息
module.exports.getUserAgoraInfo = function(token) { 
    let userObj = userTokenCache[token]
    if (userObj) {
        let userAgoraIdIndex = userAograCahce[userObj.id]
        userObj.aograId = userAgoraIdIndex
        return {error: null, data: userObj}
    }
    return {error: 10002, data: null}
}

//查询用户
module.exports.getUser = function(token,userId) { 
    let currentUser = userTokenCache[token]
    if (currentUser) {
        if(userId){
            let userObj = userTable.find(o => o.id === userId)
            if(userObj){
                return {error: null, data: userObj}
            }else{
                return {error: 10004, data: null}
            }
            
        }else{
            return {error: null, data: currentUser}
        }
    }
    return {error: 10002, data: null}
}



