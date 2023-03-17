const { v4: uuidv4, NIL } = require('uuid')
const agora_service = require('./agora_service.js')
const user_service = require('./user_service.js')

//用户所在的频道
//key 用户id
//value 频道对象
const userChannelMap = {}

//频道最新更新时间戳
const channelUpdateTimestampMap = {}


//用户最新的更新状态
//key 用户id
//value 更新时间戳
const userUpdateStatusMap = {}













//待处理的生活流素材队列
const unHandleLifeFlowQueue = []

//处理完的生活流
const lifeFlowQueue = []

//最新的生活流时间戳
var lifeFlowUpdateTimeStamp = Date.now()


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

function setChannelUpdateTimeStamp(channelId) {
    channelUpdateTimestampMap[channelId] = Date.now()
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
        channel.playerList.push(userModel2)
        userChannelMap[otherUserId] = channel
    }
    //生成链接token
    let {error: rtcError,data:{rtcToken}} = agora_service.generateRTCToken(channel.id, userModel1.agoraId, "publisher")
    channel.token = rtcToken

    //已经存在
    if (userObj != null) {
        return {error: 0, data: channel , timeStamp: getChannelUpdateTimeStamp(channel.id)}
    }


    //从之前的频道移除
    let lastChannel = userChannelMap[userModel1.id]
    if (lastChannel) {
        //更新时间戳
        setChannelUpdateTimeStamp(lastChannel.id)

        let userIndex = lastChannel.playerList.findIndex( o => o.id === userModel1.id )
        if(userIndex != -1){
            lastChannel.playerList.splice(userIndex, 1)    
        }
    }
    
    //加入新的频道
    channel.playerList.push(userModel1)
    userChannelMap[userModel1.id] = channel

    //更新时间戳
    setChannelUpdateTimeStamp(channel.id)

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
        setChannelUpdateTimeStamp(lastChannel.id)

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

        return {error: null, data: channel, timeStamp: lastestTimeStamp}
    }

    return {error: null, data: null}
}

var lifeFlowMessages = []

//从后往前取lifeFlowMessages内的数据
// timeStamp 为最旧的时间戳,结束取数据的时间戳
// count 为最多取多少条
// 返回的数据从lifeFlowMessages中slice出的数据
function _getLifeFlowData(timeStamp, count){
    var sliceCount = 0
    for (let index = lifeFlowMessages.length - 1; index >= 0; index--) {
        const element = lifeFlowMessages[index];
        sliceCount++;
        if(element.timeStamp <= timeStamp || sliceCount >= count){
            return lifeFlowMessages.slice(index + 1, index + sliceCount)
        }
    }
}


//获取生活流更新
module.exports.getLifeFlowUpdate = function(userToken, timeStamp){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    if(lifeFlowUpdateTimeStamp > timeStamp){
        return {error: null, data: _getLifeFlowData(timeStamp,20)}
    }

    return {error: null, data: null}
}


//加入生活流队列
module.exports.pushLifeFlow = function(userToken, message){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    console.log("生活流素材-加入队列")
    console.log("speechs",message.speechs)
    console.log("place",message.place)
    console.log("time",message.time)
    unHandleLifeFlowQueue.push({userId: userModel1.id, message: message})
}


//更新用户实时状态
module.exports.updateUserConnectState = function(userToken){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }
    userUpdateStatusMap[userModel1.id] = Date.now()
    return {error: null, data: null}
}




//本地任务
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////













//标记用户离线，并更新频道时间戳
function _markUserOffline(userId, channelId){
    userUpdateStatusMap[userId] = null

    const channel = userChannelMap[userId]
    if (channel == null) return;
    
    let userIndex = channel.playerList.findIndex( o => o.id === userId )
    if(userIndex != -1){
        //将用户标记为离线
        channel.playerList[userIndex].isOnline = false
    }
    channelUpdateTimestampMap[channelId] = Date.now()

}

//标记用户在线，并更新频道时间戳
function _markUserOnLine(userId, channelId){   
    const channel = userChannelMap[userId]
    if (channel == null) return;
    
    let userIndex = channel.playerList.findIndex( o => o.id === userId )
    if(userIndex != -1){
        //将用户标记为在线
        channel.playerList[userIndex].isOnline = true
    }
    channelUpdateTimestampMap[channelId] = Date.now()
}








//处理用户频道状态
module.exports.handleChannelState = function() {
    //所有拥有频道的用户
    var userIds = Object.keys(userChannelMap)


    //当用户userUpdateStatusMap的更新时间戳小于当前时间戳-10秒时,让用户离线
    //时间戳阈值
    const timeStampLimit = Date.now() - 10000
    for (let index = 0; index < userIds.length; index++) {
        const userId = userIds[index];
        const channelId = userChannelMap[userId].id
        var userUpdateTimeStamp = userUpdateStatusMap[userId]
        if(userUpdateTimeStamp){
            if(userUpdateTimeStamp < timeStampLimit){
                _markUserOffline(userId, channelId)
                
            }
        }
    }
}











//生成生活流
async function _createLifeFlow(userId, message){
    const speech_contents = message.speechs.map(obj => obj.content)
    const life_flow_content = speech_contents.join('')

    lifeFlowUpdateTimeStamp = Date.now()
    let result = {onwerId: lifeFlowMessages.userId, title: "生活流", content: life_flow_content, timeStamp: lifeFlowUpdateTimeStamp}
    return result
}


//异步处理生成生活流
async function _processLifeFlow(lifeFlowResource) {
    const lifeFlowMessage = await _createLifeFlow(lifeFlowResource.userId, lifeFlowResource.message)
    console.log("生活流素材-处理完成")
    lifeFlowQueue.push(lifeFlowMessage)
}

module.exports.handleLifeFlow = function() {   
    if(unHandleLifeFlowQueue.length > 0){
        var lifeFlowResource = unHandleLifeFlowQueue.shift()
        if (lifeFlowResource == null)
            return
        
        _processLifeFlow(lifeFlowResource)
    }
}
    