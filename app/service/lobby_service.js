const { v4: uuidv4, NIL } = require('uuid')
const user_service = require('./user_service.js')
const agora_service = require('./agora_service.js')

//场的表
const lobbyTable = []

//场内玩家
const lobbyPlayersCache = {}


//场列表
module.exports.lobbyList = function(userToken,page,numPerPage){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    if (!page) page = 0
    if (!numPerPage) numPerPage = 10
    let startIndex = numPerPage * page
    if(startIndex > lobbyTable.length){
        return {error: 10003,data: null}
    }
    let endIndex = Math.min(startIndex + numPerPage,lobbyTable.length)
    let result = lobbyTable.slice(startIndex, endIndex)
    return {error: null,data: result}
}

//获取单个场
module.exports.getLobby = function(userToken,lobbyId){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    let lobby = lobbyTable.find(o => o.id === lobbyId)
    if(lobby) {
        return {error: null,data: lobby} ;
    }else{
        return {error: 10004,data: null} ;
    }
    
}

//创建场
module.exports.createLobby = function(userToken,fieldName,fieldType) { 
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    

    let lobbyObj = {}
    lobbyObj.id = uuidv4()
    lobbyObj.name = fieldName
    lobbyObj.type = parseInt(fieldType)
    lobbyObj.createrId = currentUser.id
    lobbyTable.push(lobbyObj)

    // let onlinePlayers = []
    // onlinePlayers.push(currentUser)
    // lobbyPlayersCache[lobbyObj.id] = onlinePlayers

    return {error: null, data: lobbyObj}
}

//关闭场
module.exports.closeLobby = function(userToken,fieldId) { 
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    
    let fieldIndex = lobbyTable.findIndex( o => o.id === fieldId )
    if(fieldIndex == -1){
        return {error: 0, data: null}
    }

    if(lobbyTable[fieldIndex].createrId == currentUser.id){
        lobbyTable.splice(fieldIndex, 1)
        return {error: 0, data: null}
    }else{
        return {error: 10005, data: null}
    }
}

//加入场
module.exports.JoinField = function(userToken,fieldId) { 
    //获取当前玩家
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    //查找场
    let fieldIndex = lobbyTable.findIndex( o => o.id === fieldId )
    if(fieldIndex == -1){
        return {error: 10004, data: null}
    }

    //获取在线玩家列表
    var onlinePlayers = lobbyPlayersCache[lobbyTable[fieldIndex].id]
    if(!onlinePlayers){
        onlinePlayers = []
        lobbyPlayersCache[lobbyTable[fieldIndex].id] = onlinePlayers
    }

    //已加入
    if(onlinePlayers.find(o => o.id === currentUser.id)){
        return {error: 0, data: onlinePlayers}
    }

    onlinePlayers.push(currentUser)
    return {error: 0, data: onlinePlayers}
}

//退出场
module.exports.QuitLobby = function(userToken,fieldId) { 
    //获取当前玩家
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    //查找场
    let fieldIndex = lobbyTable.findIndex( o => o.id === fieldId )
    if(fieldIndex == -1){
        return {error: 0, data: null}
    }

    //获取在线玩家列表
    var onlinePlayers = lobbyPlayersCache[lobbyTable[fieldIndex].id]
    if(onlinePlayers){
        //验证当前玩家是否在场内
        let userIndex = onlinePlayers.findIndex(o => o.id === currentUser.id)
        if(userIndex != -1){
            onlinePlayers.splice(userIndex, 1)
        }
    }
    return {error: 0, data: null}
}

//其他玩家退出场
module.exports.UpdateOthersQuitLobby = function(userToken,fieldId,otherId) { 
    //获取当前玩家
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    //查找场
    let fieldIndex = lobbyTable.findIndex( o => o.id === fieldId )
    if(fieldIndex == -1){
        return {error: 0, data: null}
    }

    //获取在线玩家列表
    var onlinePlayers = lobbyPlayersCache[lobbyTable[fieldIndex].id]
    if(onlinePlayers){
        //验证当前玩家是否在场内
        let userIndex = onlinePlayers.findIndex(o => o.id === currentUser.id)
        if(userIndex != -1){
            //其他玩家
            let {error: agoraError,data:{agoraId:otherUserId}} = agora_service.getUserIdFromAgoraId(otherId)
            if(!agoraError){
                let otherIndex = onlinePlayers.findIndex(o => o.id === otherUserId)
                if(otherIndex != -1){
                    onlinePlayers.splice(otherIndex, 1)
                }
            }
        }
    }
    return {error: 0, data: null}
}