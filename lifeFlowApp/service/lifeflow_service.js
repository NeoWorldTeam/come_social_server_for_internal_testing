const openai_service = require('./openai_service.js')
const user_service = require('./user_service.js')
const redisStore = require('../utils/redis');




//裸数据
const rawLifeFlowQueue = []


//用户发送的分段数据
//key 用户id
//value message
const rawUserSegmentationDataMap = {}

//待处理的生活流素材队列
const preprocessLifeFlowQueue = []

// //处理完的生活流
// const lifeFlowQueue = []

//最新的生活流时间戳
var lifeFlowUpdateTimeStamp = -1

//key : 用户id
//value : state
var userLastStateCache = {}



//detectionTime 检测时间 （5分钟)
var _detectionTime =  5*60

//achieveTime 获取时间（8/10分钟）
var _achieveTime10 = 10*60
var _achieveTime8 = 8*60
var _longAchieveTime = 20*60

//durationTime 持续时间





//根据index 和 count 获取正序生活流数据
module.exports.getLifeFlowByIndex = async function(index, count) {
    const jsonArr = await redisStore.lRange('lifeFlowQueue', index, index + count - 1)
    const objArr = jsonArr.map(json => JSON.parse(json)); 
    return objArr
}

async function _getReverseLifeFlowByIndex(index, count){
    let startIndex = (-index - 1) - (count - 1)
    var endIndex = -index - 1
    const jsonArr = await redisStore.lRange('lifeFlowQueue', startIndex, endIndex)
    const objArr = jsonArr.map(json => JSON.parse(json));
    return objArr
}

module.exports.getLifeFlowQueueLength = async function() {
    return await redisStore.lLen("lifeFlowQueue")
}


//根据index 和 count 获取倒序生活流数据
module.exports.getReverseLifeFlowByIndex = async function(index, count) {
    return await _getReverseLifeFlowByIndex(index, count)
}

async function _getReverseLifeFlowRawByIndex(index, count){
    let startIndex = (-index - 1) - (count - 1)
    var endIndex = -index - 1
    const jsonArr = await redisStore.lRange('lifeFlowQueueRaw', startIndex, endIndex)
    const objArr = jsonArr.map(json => JSON.parse(json));
    return objArr
}


//根据index 和 count 获取倒序生活流源数据
module.exports.getReverseLifeFlowRawByIndex = async function(index, count) {
    return await _getReverseLifeFlowRawByIndex(index, count)
}

async function _getReverseLifeFlowLogsByIndex(index, count){
    let startIndex = (-index - 1) - (count - 1)
    var endIndex = -index - 1
    const jsonArr = await redisStore.lRange('lifeFlowGenerateLog', startIndex, endIndex)
    const objArr = jsonArr.map(json => JSON.parse(json));
    return objArr
}

module.exports.getReverseLifeFlowLogsByIndex = async function(index, count) {
    return await _getReverseLifeFlowLogsByIndex(index, count)
}




async function _addLifeFlowLog(lifeFlowResource,generateLog) {
    const lifeFlowResourceJson = JSON.stringify(lifeFlowResource)
    const generateLogJson = JSON.stringify(generateLog)
    await redisStore.rPush('lifeFlowQueueRaw', lifeFlowResourceJson)
    await redisStore.rPush('lifeFlowGenerateLog', generateLogJson)
}

async function _addLifeFlow(lifeFlow, lifeFlowResource, generateLog) {
    const json = JSON.stringify(lifeFlow)
    await redisStore.rPush('lifeFlowQueue', json)
    //生成一条生活流log

    _addLifeFlowLog(lifeFlowResource,generateLog)
}

// module.exports.addLifeFlow = async function(lifeFlow, lifeFlowResource) {
//     await _addLifeFlow(lifeFlow, lifeFlowResource)
// }









// 通过最迟的时间戳和最长的条数来获取数据
// timeStamp 为最旧的时间戳,结束取数据的时间戳
// count 为最多取多少条
//从后往前取lifeFlowMessages内的数据
// 返回的数据从lifeFlowMessages中slice出的数据
async function _getLifeFlowData(timeStamp, count){
    let pageIndex = 0
    //结果是从新到旧
    let result = []
    let isFinish = false
    do{
        const startIndex = pageIndex * count
        const queryLifeFlowQueue = await _getReverseLifeFlowByIndex(startIndex, count)
        pageIndex++
        if (!queryLifeFlowQueue) break
        isFinish = queryLifeFlowQueue.length < count



        for (let index = queryLifeFlowQueue.length - 1; index >= 0; index--) {
            const element = queryLifeFlowQueue[index];
            if(element.timeStamp <= timeStamp){
                isFinish = true
                break
            }

            result.push(element)

            if (result.length >= count) {
                isFinish = true
                break
            }
        }
    }while(!isFinish);
    return result.reverse()
}


//根据时间戳获取生活流
module.exports.getLifeFlowUpdate = async function(userToken, timeStamp){
    let {error: userError1,data: userModel1} = user_service.getUser(userToken)
    if (userError1) {
        return {error: userError1, data: null}
    }

    if(lifeFlowUpdateTimeStamp == -1) {
        const lifeFlowMessages = await _getReverseLifeFlowByIndex(0, 1)
        if (lifeFlowMessages && lifeFlowMessages.length > 0){
            lifeFlowUpdateTimeStamp = lifeFlowMessages[0].timeStamp
        }else{
            lifeFlowUpdateTimeStamp = 0
        }
        
    }

    //有更新
    if(lifeFlowUpdateTimeStamp > parseInt(timeStamp)){
        const lifeFlowMessages = await _getLifeFlowData(timeStamp, 10);
        return {error: null, data: lifeFlowMessages, timeStamp: lifeFlowUpdateTimeStamp};
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




//////////////////////////////////////////////////////////////////////////////////////








function toMinutes(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
}

let globalGenerateLog = []

//生成生活流
////{userId: userId, userName: userName, content: userPieceTempDatas.content, address: address, achieveTime: achieveTime }
async function _createLifeFlow(lifeFlowResource, currentTimeStamp){
    const userId = lifeFlowResource.userId
    const userName = lifeFlowResource.userName
    const speech_contents = lifeFlowResource.content
    const address = lifeFlowResource.address
    const achieveTime = lifeFlowResource.achieveTime
    const isSatisfyData = achieveTime < _achieveTime10
    const duration = toMinutes(lifeFlowResource.achieveTime)
    globalGenerateLog = []


    //场景状态判定
    const statePrompt = openai_service.generateStatePrompt([userName], address, speech_contents)
    const state = await openai_service.generateContent(statePrompt)
    
    if (!state) {
        globalGenerateLog.push({name: "场景状态判定", prompt: statePrompt, result: "场景状态判定-生成失败"})
        return null
    }
    globalGenerateLog.push({name: "场景状态判定", prompt: statePrompt, result: state})
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
            globalGenerateLog.push({name: "状态对比", prompt: stateComparePrompt, result: "状态对比-生成失败"})
            return null
        }
        globalGenerateLog.push({name: "状态对比", prompt: stateComparePrompt, result: stateCompare})
        console.log("状态对比结果:",stateCompare)
        isSameState = stateCompare.charAt(0) === 'A'
    }


    if (isSameState) {
        //长总结
        //users, states, times
        const summaryPrompt = openai_service.generateLongSummaryPrompt([userName], [lastStateMap.lastState,state], [lastStateMap.lastDuration,duration])
        const summary = await openai_service.generateContent(summaryPrompt)
        if (!summary) {
            globalGenerateLog.push({name: "长总结", prompt: summaryPrompt, result: "长总结-生成失败"})
            return null
        }
        globalGenerateLog.push({name: "长总结", prompt: summaryPrompt, result: summary})
        console.log("长总结:",summary)

        const life_flow_content = summary.trimStart();
        console.log("压缩内容:",life_flow_content)

        
        let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: currentTimeStamp}

        return result
    }else{

        //不满足的内容量 直接返回场景状态
        if (!isSatisfyData) {
            const life_flow_content = state.trimStart();
            console.log("压缩内容:",life_flow_content)
            globalGenerateLog.push({name: "直接返回场景状态", prompt: "", result: life_flow_content})
            let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: currentTimeStamp}
    
            return result
        }

        //生成摘要
        const summaryPrompt = openai_service.generateSummaryPrompt([userName], address, speech_contents, state)
        const summary = await openai_service.generateContent(summaryPrompt)
        if (!summary) {
            globalGenerateLog.push({name: "个人总结", prompt: summaryPrompt, result: "个人总结-生成失败"})
            return null
        }
        globalGenerateLog.push({name: "个人总结", prompt: summaryPrompt, result: summary})
        console.log("摘要:",summary)

        //压缩内容
        const compressContentPrompt = openai_service.generateCompressionPrompt(summary)
        const compressContent = await openai_service.generateContent(compressContentPrompt)
        if (!compressContent) {
            globalGenerateLog.push({name: "压缩内容", prompt: compressContentPrompt, result: "风格化内容-生成失败"})
            return null
        }
        
        const life_flow_content = compressContent.trimStart();
        console.log("压缩内容:",life_flow_content)
        globalGenerateLog.push({name: "压缩内容", prompt: compressContentPrompt, result: life_flow_content})

        let result = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: currentTimeStamp}
        return result
    }





}




//异步处理生成生活流
//{userId: userId, userName: userName, content: userPieceTempDatas.content, address: address, isSatisfyData: isSatisfyData}
async function _processLifeFlow(lifeFlowResource) {
    let _lifeFlowUpdateTimeStamp = Date.now()
    const lifeFlowMessage = await _createLifeFlow(lifeFlowResource, _lifeFlowUpdateTimeStamp)
    if (!lifeFlowMessage) {
        console.log("生活流素材-丢弃:", lifeFlowResource)
        // await _processLifeFlowTest(ttttestIndex++,lifeFlowResource)
        return
    }
    lifeFlowUpdateTimeStamp = _lifeFlowUpdateTimeStamp
    console.log("生活流素材-处理完成:", lifeFlowMessage)
    await _addLifeFlow(lifeFlowMessage, lifeFlowResource, Object.assign({}, globalGenerateLog))
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
function _preprocessing(lifeFlowRaw) {

    //数据拥有者
    const userId = lifeFlowRaw.userId
    if(!userId) return
    const speech_content = parseSpeechContent(lifeFlowRaw.message)
    const time = lifeFlowRaw.message.time

    //数据更新
    //TODO : 1. 这里最好还是改成数组 2. 丢弃合并后，后面在加入的数据
    let userPieceTempDatas = rawUserSegmentationDataMap[userId]
    if(userPieceTempDatas){
        mergeUserPieceData(userPieceTempDatas, speech_content, time)
    }else {
        userPieceTempDatas = {content:speech_content, startTimeStamp: time, detectionTime: _detectionTime, durationTime: 0, achieveTime: _achieveTime10}
    }
    rawUserSegmentationDataMap[userId] = userPieceTempDatas

    
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
    delete rawUserSegmentationDataMap[userId]

    //加入数据到unHandleLifeFlowQueue
    console.log("生活流预处理数据-加入队列")
    preprocessLifeFlowQueue.push(processData)
}



var ttttestIndex = 0
async function _processLifeFlowTest(index, lifeFlowResource) {
    lifeFlowUpdateTimeStamp =  Date.now()
    const userId = "userId"+index
    const userName = "userName"+index
    const life_flow_content = "life_flow_content"+index
    const lifeFlowMessage = {onwerId: userId, title: userName, content: life_flow_content, timeStamp: lifeFlowUpdateTimeStamp}

    console.log("Test 生活流素材-处理完成:", lifeFlowMessage)
    await addLifeFlow(lifeFlowMessage, lifeFlowResource)
}




module.exports.handleLifeFlow = function() {
    do {
        var lifeFlowResource = rawLifeFlowQueue.shift()
        if (lifeFlowResource == null) break
        console.log("生活流素材-取出队列")
        _preprocessing(lifeFlowResource)
        
    } while(false)

    do {
        
        var lifeFlowResource = preprocessLifeFlowQueue.shift()
        if (lifeFlowResource == null) break
        console.log("生活流预处理数据-取出队列")
        _processLifeFlow(lifeFlowResource)
    } while(false)
}





  


    