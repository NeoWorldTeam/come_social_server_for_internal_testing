const { v4: uuidv4, NIL } = require('uuid')
const agora_service = require('./agora_service.js')
const user_service = require('./user_service.js')
const openai_service = require('./openai_service.js')
// const redisStore = require('../utils/redis');

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













//裸数据
const rawLifeFlowQueue = []

//key 用户id
//value message
const rawDataTempMap = {}

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



//从后往前取lifeFlowMessages内的数据
// timeStamp 为最旧的时间戳,结束取数据的时间戳
// count 为最多取多少条
// 返回的数据从lifeFlowMessages中slice出的数据
function _getLifeFlowData(timeStamp, count){
    var sliceCount = 0
    var startIndex = 0
    for (let index = lifeFlowQueue.length - 1; index >= 0; index--) {
        const element = lifeFlowQueue[index];
        startIndex = index
        sliceCount++;

        if(element.timeStamp <= timeStamp || sliceCount >= count){
            break
        }
    }

    return lifeFlowQueue.slice(startIndex, startIndex + sliceCount)
}


//获取生活流更新
module.exports.getLifeFlowUpdate = function(userToken, timeStamp){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    if(lifeFlowUpdateTimeStamp > timeStamp){
        return {error: null, data: _getLifeFlowData(timeStamp,20), timeStamp: lifeFlowUpdateTimeStamp}
    }

    return {error: null, data: null}
}


//加入生活流队列
module.exports.pushLifeFlow = function(userToken, message){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    const resource =  JSON.parse(message)
    console.log("生活流素材-加入队列")
    console.log("speechs",resource.speechs)
    console.log("place",resource.place)
    console.log("time",resource.time)
    rawLifeFlowQueue.push({userId: userModel1.id,userName: userModel1.name, message: resource})
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






//key : 用户id
//value : state
var userLastStateCache = {}


function toMinutes(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
}

//生成生活流
////{userId: userId, userName: userName, content: userPieceTempDatas.content, address: address, achieveTime: achieveTime }
async function _createLifeFlow(lifeFlowResource){
    const userId = lifeFlowResource.userId
    const userName = lifeFlowResource.userName
    const speech_contents = lifeFlowResource.content
    const address = lifeFlowResource.address
    const achieveTime = lifeFlowResource.achieveTime
    const isSatisfyData = achieveTime < _achieveTime10
    const duration = toMinutes(lifeFlowResource.achieveTime)


    //场景状态判定
    const statePrompt = openai_service.generateStatePrompt([userName], address, speech_contents)
    const state = await openai_service.generateContent(statePrompt)
    if (!state) {
        return null
    }
    console.log("场景状态:",state)

    //上一个状态
    const lastStateMap = userLastStateCache[userId]

    //更新状态
    userLastStateCache[userId] = {lastState: state, lastDuration: duration}

    //状态是否相同
    let isSameState = false
    //存在上一次状态，需要进行对比
    if (lastStateMap) {
        //状态对比
        const stateComparePrompt = openai_service.generateStateComparePrompt(lastStateMap.lastState, state)
        const stateCompare = await openai_service.generateContent(stateComparePrompt)
        if (!stateCompare) {
            return null
        }
        console.log("状态对比结果:",stateCompare)
        isSameState = stateCompare.charAt(0) === 'A'
    }


    if (isSameState) {
        //长总结
        //users, states, times
        const summaryPrompt = openai_service.generateLongSummaryPrompt([userName], [lastStateMap.lastState,state], [lastStateMap.lastDuration,duration])
        const summary = await openai_service.generateContent(summaryPrompt)
        if (!summary) {
            return null
        }
        console.log("长总结:",summary)

        const life_flow_content = summary.trimStart();
        console.log("压缩内容:",life_flow_content)

        lifeFlowUpdateTimeStamp = Date.now()
        let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: lifeFlowUpdateTimeStamp}

        return result
    }else{

        //不满足的内容量 直接返回场景状态
        if (!isSatisfyData) {
            const life_flow_content = state.trimStart();
            console.log("压缩内容:",life_flow_content)
    
            lifeFlowUpdateTimeStamp = Date.now()
            let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: lifeFlowUpdateTimeStamp}
    
            return result
        }

        //生成摘要
        const summaryPrompt = openai_service.generateSummaryPrompt([userName], address, speech_contents, state)
        const summary = await openai_service.generateContent(summaryPrompt)
        if (!summary) {
            return null
        }
        console.log("摘要:",summary)

        //压缩内容
        const compressContentPrompt = openai_service.generateCompressionPrompt(summary)
        const compressContent = await openai_service.generateContent(compressContentPrompt)
        if (!compressContent) {
            return null
        }
        
        const life_flow_content = compressContent.trimStart();
        console.log("压缩内容:",life_flow_content)

        lifeFlowUpdateTimeStamp = Date.now()
        let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: lifeFlowUpdateTimeStamp}
        return result
    }





}




//异步处理生成生活流
//{userId: userId, userName: userName, content: userPieceTempDatas.content, address: address, isSatisfyData: isSatisfyData}
async function _processLifeFlow(lifeFlowResource) {
    const lifeFlowMessage = await _createLifeFlow(lifeFlowResource)
    if (!lifeFlowMessage) {
        console.log("生活流素材-丢弃:", lifeFlowResource)
        return
    }
    console.log("生活流素材-处理完成:", lifeFlowMessage)
    lifeFlowQueue.push(lifeFlowMessage)
}














//解析地址
function _getStableAddress(message){
    if (!message) return ""
    const place = message.place
    if (place.thoroughfare){
        return place.thoroughfare
    }

    if (place.name) {
        return place.name
    }

    return [place.country,place.administrativeArea,place.subAdministrativeArea,place.locality].join(" ")
}


//解析说话内容
function parseSpeechContent(message) {
    let speech_contents = ""
    if (message && message.speechs) {
        speech_contents = message.speechs.map(obj => obj.content).join("。")
    }
    return speech_contents
}


var _detectionTime =  5*60
var _achieveTime10 = 10*60
var _achieveTime8 = 8*60
var _longAchieveTime = 20*60

//content 内容
//startTimeStamp 开始时间
//durationTime 持续时间
//detectionTime 检测时间 （5分钟)
//achieveTime 获取时间（8/10分钟）
function mergeUserPieceData(data, content, timeStamp) {
    data.content += content
    data.durationTime = timeStamp - data.startTimeStamp
}

function detectionRawData(data) {
    //第一轮检查
    if (data.durationTime >= data.detectionTime){
        //小于400字
        if (data.content.length < 400) {
            data.achieveTime = _achieveTime10
        }else if (data.content.length < 800) {
            data.achieveTime = _achieveTime8
        }else {
            data.achieveTime = data.durationTime + 1
        }
        //不再检查
        data.detectionTime = _longAchieveTime
    }
}
 
//异步预处理数据
async function _preprocessing(lifeFlowRaw) {

    //数据拥有者
    const userId = lifeFlowRaw.userId
    if(!userId) return
    const speech_content = parseSpeechContent(lifeFlowRaw.message)
    const time = lifeFlowRaw.message.time

    //数据更新
    //TODO : 1. 这里最好还是改成数组 2. 丢弃合并后，后面在加入的数据
    let userPieceTempDatas = rawDataTempMap[userId]
    if(userPieceTempDatas){
        mergeUserPieceData(userPieceTempDatas, speech_content, time)
    }else {
        userPieceTempDatas = {content:speech_content, startTimeStamp: time, detectionTime: _detectionTime, durationTime: 0, achieveTime: _achieveTime10}
    }
    rawDataTempMap[userId] = userPieceTempDatas

    
    //数据检查
    detectionRawData(userPieceTempDatas)

    //不满足生成
    if (userPieceTempDatas.durationTime < userPieceTempDatas.achieveTime){
        return
    }

    //地址生成
    const address = _getStableAddress(lifeFlowRaw.message)
    const userName = lifeFlowRaw.userName

    const processData = {userId: userId, userName: userName, content: userPieceTempDatas.content, address: address, achieveTime: userPieceTempDatas.achieveTime}
    delete rawDataTempMap[userId]

    //加入数据到unHandleLifeFlowQueue
    console.log("生活流预处理数据-加入队列")
    unHandleLifeFlowQueue.push(processData)
}

module.exports.handleLifeFlow = function() {
    do {
        var lifeFlowResource = rawLifeFlowQueue.shift()
        if (lifeFlowResource == null) break
        console.log("生活流素材-取出队列")
        _preprocessing(lifeFlowResource)
    } while(false)

    do {
        
        var lifeFlowResource = unHandleLifeFlowQueue.shift()
        if (lifeFlowResource == null) break
        console.log("生活流预处理数据-取出队列")
        _processLifeFlow(lifeFlowResource)
    } while(false)
}
    