const { v4: uuidv4 } = require('uuid')
const nameCache = {}
const userAograCahce = {}
var userAgoraIdIndex = 0

module.exports.generateUser = function(userName) { 
    if(userName == null || userName == ""){
        return{ errorCode:1000, data:null}
    }


    var userObj = null
    do{
        if (userName != null) {
            userObj = nameCache[userName]
            if(userObj != null){
                break
            }
        }
        userObj = {"name":userName,"token":uuidv4()}
        nameCache[userName] = userObj
        userAograCahce[userName] = userAgoraIdIndex++
    }while(false)
    return {data:userObj}
}

module.exports.getAgoraInfo = function(token) { 
    if(token == null || token == ""){
        return{ errorCode:1000, data:null}
    }


    var userObj = null
    do{
        if (userName != null) {
            userObj = nameCache[userName]
            if(userObj != null){
                break
            }
        }
        userObj = {"name":userName,"token":uuidv4()}
        nameCache[userName] = userObj
        userAograCahce[userName] = userAgoraIdIndex++
    }while(false)
    return {data:userObj}
}

