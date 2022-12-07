const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')
const agora_service = require('./agora_service.js')

//场的表
const lobbyTable = []
//维护场的状态
const fieldStatusMap = {}

//场内玩家
const lobbyPlayersCache = {}






//1 << 1 在线用户更新
const FieldStateOnlinePlayer = 1 << 1
//1 << 0 场自身状态
const FieldStateLifeCycles = 1 << 0
//所有状态的 mask
const FieldStateFullMask = FieldStateLifeCycles | FieldStateOnlinePlayer


//初始化场的状态
function initFieldState(fieldId) {
    let stateTable = []
    stateTable.push({updateTime:process.uptime(),updateState:FieldStateFullMask})
    fieldStatusMap[fieldId] = stateTable
}

//更新场的状态
function updateFieldState(fieldId,state) {
    let t_now = parseInt(process.uptime() * 1000, 10)
    let stateTable = fieldStatusMap[fieldId]
    if(!stateTable){
        return {error: 10004}
    }
    stateTable.push({updateTime:t_now,updateState:state})
}

//通过时间戳得到更新
function getFieldState(fieldId,lastUpdateTime) {
    let stateTable = fieldStatusMap[fieldId]
    if(!stateTable){
        return {error: 10004}
    }

    //根据时间戳 检索状态的更新
    var recordStateChange = 0
    var latestTimeStamp = 0
    let stateLength = stateTable.length
    for (let i = stateLength - 1; i >= 0; --i) {
        let stateItem = stateTable[i]

        //更新最新时间戳
        if(!latestTimeStamp){
            latestTimeStamp = stateItem.updateTime
        }

        //更新有效的状态
        if(stateItem.updateTime > lastUpdateTime){
            recordStateChange = recordStateChange | stateItem.updateState
        }else{
            break
        }

        if (recordStateChange == FieldStateFullMask) {
            break
        } 
    }

    return {data:{recordStateChange:recordStateChange,latestTimeStamp:latestTimeStamp}}
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
    lobbyObj.createTime = parseInt(process.uptime() * 1000, 10)
    lobbyTable.push(lobbyObj)
    initFieldState(lobbyObj.id)
    
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
        return {error: null,data: lobby}
    }else{
        return {error: 10004,data: null}
    }
}





//拉取场的状态
module.exports.pullFieldState = function(userToken,lobbyId,lastTimeStamp){
    //获取场
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    let fieldItem = lobbyTable.find(o => o.id === lobbyId)
    if(!fieldItem) {
        return {error: 10004,data: null}
    }

    //获取状态更新
    let {error: fieldStateError, data: {recordStateChange,latestTimeStamp}} = getFieldState(lobbyId, lastTimeStamp)
    if(fieldStateError){
        return {error:fieldStateError}
    }

    //更新用户的onlineCount
    var onlinePlayers = lobbyPlayersCache[lobbyId]
    if(onlinePlayers){
        let onlinePlayer = onlinePlayers.find(o => o.id === currentUser.id)
        if(onlinePlayer){
            onlinePlayer.onlineCount = 6
        }
    }

    


    //没有更新
    if(recordStateChange == 0){
        return {data:{latestTimeStamp:latestTimeStamp}}
    }

    //组装数据
    var pullData = {latestTimeStamp:latestTimeStamp}
    if(recordStateChange & FieldStateOnlinePlayer){
        var onlinePlayers = lobbyPlayersCache[lobbyId]
        if(onlinePlayers){
            pullData.onlinePlayers = onlinePlayers
        }else{
            pullData.onlinePlayers = []
        }
    }

    return {data: pullData} 
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

    //加入
    updateFieldState(fieldId,FieldStateOnlinePlayer)
    currentUser.onlineCount = 9
    currentUser.joinTimeStamp = parseInt(process.uptime() * 1000, 10)

    let {error: agoraError, data: {agoraId}} = agora_service.getUserAgoraId(currentUser.id)
    if(!agoraError){
        currentUser.agoraId = agoraId
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
            updateFieldState(fieldId,FieldStateOnlinePlayer)
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
                    updateFieldState(fieldId,FieldStateOnlinePlayer)
                }
            }
        }
    }
    return {error: 0, data: null}
}










//更新玩家状态
module.exports.UpdatePlayerOnlineState = function() { 
    
    for(let feildItem of lobbyTable){
        let onlinePlayers = lobbyPlayersCache[feildItem.id]
        if (onlinePlayers && onlinePlayers.length) {
            // console.log("计算一次")
            onlinePlayers.forEach((item, index)=>{
                item.onlineCount = item.onlineCount - 1
            });

            const lastestOnlinePlayers = onlinePlayers.filter( item => item.onlineCount > 0 )
            if(lastestOnlinePlayers.length != onlinePlayers.length){
                lobbyPlayersCache[feildItem.id] = lastestOnlinePlayers
                updateFieldState(feildItem.id,FieldStateOnlinePlayer)
            }
        }
    }
}
