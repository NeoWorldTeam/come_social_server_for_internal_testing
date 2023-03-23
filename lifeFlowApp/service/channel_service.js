const { v4: uuidv4, NIL } = require('uuid')
const agora_service = require('./agora_service.js')
const user_service = require('./user_service.js')


//用户所在的频道
//key 用户id
//value 频道对象
const userChannelMap = {}
//频道最新更新时间戳
const channelUpdateTimestampMap = {}
//在线用户时间戳
//key 用户id
//value 更新时间戳
const onLineUserTimeStampMap = {}



function _createChannel(userId) {
    let channelObj = {}
    channelObj.id = uuidv4()
    channelObj.createrId = userId
    channelObj.createTime = parseInt(process.uptime() * 1000, 10)
    channelObj.playerList = []
    return channelObj
}

function getChannelUpdateTimeStamp(channelId) {
    if (channelUpdateTimestampMap[channelId]) {
        return channelUpdateTimestampMap[channelId]
    }else{
        channelUpdateTimestampMap[channelId] = Date.now()
        return channelUpdateTimestampMap[channelId]
    }
}

function updateChannelStateTimeStamp(channelId, timeStamp) {
    
    if (timeStamp) {
        channelUpdateTimestampMap[channelId] = timeStamp
    }else{
        channelUpdateTimestampMap[channelId] = Date.now()
    }

    console.log("更新频道:",channelId,",时间戳: ",channelUpdateTimestampMap[channelId])
}

    


//连接用户
module.exports.connectUser = function(userToken, otherUserId){


    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    let {error: userError2,data: userModel2} = user_service.getUser(userToken,otherUserId)
    if (userError2) {
        return {error: userError2, data: null}
    }

    var channel = userChannelMap[otherUserId]
    var userObj = null
    if (channel) {
        userObj = channel.playerList.find(o => o.id === userModel1.id)
    }else{
        channel = _createChannel(otherUserId)
        userModel2.isOnline = false
        channel.playerList.push(userModel2)
        userChannelMap[otherUserId] = channel
    }


    //生成链接token
    let {error: rtcError,data:{rtcToken}} = agora_service.generateRTCToken(channel.id, userModel1.agoraId, "publisher")
    channel.token = rtcToken
    console.log("生成链接token:",rtcToken)

    //已经存在
    if (userObj != null) {
        return {error: 0, data: channel , timeStamp: getChannelUpdateTimeStamp(channel.id)}
    }


    //从之前的频道移除
    let lastChannel = userChannelMap[userModel1.id]
    if (lastChannel) {
        //更新时间戳
        updateChannelStateTimeStamp(lastChannel.id)

        let userIndex = lastChannel.playerList.findIndex( o => o.id === userModel1.id )
        if(userIndex != -1){
            lastChannel.playerList.splice(userIndex, 1)
        }
    }
    
    //加入新的频道
    userModel1.isOnline = false
    channel.playerList.push(userModel1)
    userChannelMap[userModel1.id] = channel

    //更新时间戳
    updateChannelStateTimeStamp(channel.id)

    return {error: null, data: channel, timeStamp: getChannelUpdateTimeStamp(channel.id)}
}

//取消连接
module.exports.cancleConnect = function(userToken){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    let lastChannel = userChannelMap[userModel1.id]
    if (lastChannel) {
        //更新时间戳
        updateChannelStateTimeStamp(lastChannel.id)

        //从频道移除
        let userIndex = lastChannel.playerList.findIndex( o => o.id === userModel1.id )
        if(userIndex != -1){
            lastChannel.playerList.splice(userIndex, 1)
        }
    }
    //频道关系移除
    delete userChannelMap[userModel1.id]
    
    return {error: null, data: null}
}



module.exports.getChannelUpdate = function(userToken, timeStamp){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    let channel = userChannelMap[userModel1.id]
    if(channel){
        let lastestTimeStamp = getChannelUpdateTimeStamp(channel.id)
        if(lastestTimeStamp <= timeStamp){
            return {error: null, data: null}
        }

        //生成链接token
        let {error: rtcError,data:{rtcToken}} = agora_service.generateRTCToken(channel.id, userModel1.agoraId, "publisher")
        channel.token = rtcToken
        console.log("生成链接token:",rtcToken)

        return {error: null, data: channel, timeStamp: lastestTimeStamp}
    }

    return {error: null, data: null}
}





//更新用户实时状态
module.exports.updateUserConnectState = function(userToken){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }
    _markUserOnLine(userModel1.id)
    return {error: null, data: null}
}


//本地任务
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////













//标记用户离线，并更新频道时间戳
function _markUserOffline(userId){
    onLineUserTimeStampMap[userId] = null

    const channel = userChannelMap[userId]
    if (channel == null) return;
    
    let userIndex = channel.playerList.findIndex( o => o.id === userId )
    if(userIndex == -1){
        return
    }
    
    if (!channel.playerList[userIndex].isOnline) {
        return
    }

    //将用户标记为离线
    console.log("用户离线:",channel.playerList[userIndex].name)
    channel.playerList[userIndex].isOnline = false
    updateChannelStateTimeStamp(channel.id)

}

//标记用户在线，并更新频道时间戳
function _markUserOnLine(userId){   
    
    const currentTimeStamp = Date.now()
    onLineUserTimeStampMap[userId] = currentTimeStamp


    const channel = userChannelMap[userId]
    if (channel == null) return;
    
    let userIndex = channel.playerList.findIndex( o => o.id === userId )
    if(userIndex == -1){
        return
    }

    if (channel.playerList[userIndex].isOnline) {
        return
    }
    //将用户标记为在线
    console.log("用户上线:",channel.playerList[userIndex].name)
    channel.playerList[userIndex].isOnline = true

    updateChannelStateTimeStamp(channel.id, currentTimeStamp)
}


//处理用户频道状态
module.exports.handleChannelState = function() {
    //所有拥有频道的用户
    var userIds = Object.keys(userChannelMap)


    //当用户userUpdateStatusMap的更新时间戳小于当前时间戳-5秒时,让用户离线
    //时间戳阈值
    const timeStampLimit = Date.now() - 5000
    for (let index = 0; index < userIds.length; index++) {
        const userId = userIds[index];
        var userUpdateTimeStamp = onLineUserTimeStampMap[userId]

        if (userUpdateTimeStamp == null || userUpdateTimeStamp == undefined) {
            continue
        }

        if (userUpdateTimeStamp >= timeStampLimit) {
            continue
        }
        _markUserOffline(userId)
    }
}




