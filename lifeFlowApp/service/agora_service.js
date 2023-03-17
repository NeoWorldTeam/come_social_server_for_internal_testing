const dotenv = require('dotenv');
dotenv.config();


const RtcTokenBuilder = require('./agora/src/RtcTokenBuilder2').RtcTokenBuilder
const RtcRole = require('./agora/src/RtcTokenBuilder2').Role


const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const tokenExpirationInSecond = 3600
const privilegeExpirationInSecond = 3600


//用户声网缓存
const useragoraCahce = {}

//声网分配ID
var userAgoraIdIndex = 10


module.exports.generateRTCToken = (channelId, uid, role, expireTime, tokentype = "uid") => {
  
  
  // get role
  let rtcRole
  if (role === 'audience') {
    rtcRole = RtcRole.SUBSCRIBER
  } else if (role === 'publisher') {
    rtcRole = RtcRole.PUBLISHER
  } else {
    rtcRole = RtcRole.PUBLISHER
  }

  // calculate privilege expire time
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }



  if (tokentype === 'userAccount') {
      // const token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, rtcRole, privilegeExpireTime);
      // return {error: 0, data: {"rtcToken":token}}
    } else if (tokentype === 'uid') {
          
      const tokenA = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelId, uid, rtcRole, tokenExpirationInSecond, privilegeExpirationInSecond)
      console.log("channelId:",channelId,"uid:",uid,"rtcRole:",rtcRole,"tokenA:",tokenA)
      
      return {error: 0, data: {"rtcToken":tokenA}}
    } else {
      return {error: 10004}
  }
}
  

//create agora id
module.exports.generateAgoraId = (userId) => {
  let userCache = useragoraCahce[userId]
  if (userCache == null) {
    userCache = {agoraId: userAgoraIdIndex++}
    useragoraCahce[userId] = userCache
  }
  return {error: 0, data: userCache}
}

//get agora id
module.exports.getUserAgoraId = function(userId) { 
  let userCache = useragoraCahce[userId]
  if (userCache) {
    return {error: 0, data: userCache}
  }

  return {error: 10004}
}


module.exports.getUserIdFromAgoraId = function(agoraId) {
  for(let userId in useragoraCahce) {
    let {agoraId:userAgoraId} = useragoraCahce[userId]
    if(userAgoraId == agoraId){
      return {data: {userId:userId}}
    } 
  }

  return {error: 10004}
}




