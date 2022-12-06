const dotenv = require('dotenv');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole} = require('agora-access-token');
dotenv.config();

const user_service = require('./user_service.js')


const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;


//用户声网缓存
const userAograCahce = {}

//声网分配ID
var userAgoraIdIndex = 10


module.exports.generateRTCToken = (channelName, uid, role, expireTime, tokentype = "uid") => {
  console.log(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime, tokentype)
  
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
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;


  if (tokentype === 'userAccount') {
      const token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, rtcRole, privilegeExpireTime);
      return {error: 0, data: {"rtcToken":token}}
    } else if (tokentype === 'uid') {
      const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, rtcRole, privilegeExpireTime);
      return {error: 0, data: {"rtcToken":token}}
    } else {
      return {error: 10004}
  }
}
  
module.exports.generateRTMToken = (uid, role, privilegeExpireTime) => {
  // build the token
  console.log(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime)
  const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return {error: 0, data: {"rtmToken":token }};
}


//create agora id
module.exports.generateAgoraId = (userId) => {
  let userCache = userAograCahce[userId]
  if (userCache == null) {
    userCache = {aograId: userAgoraIdIndex++}
    userAograCahce[userId] = userCache
  }
  return {error: 0, data: userCache}
}

//get agora id
module.exports.getUserAgoraId = function(userId) { 
  let userCache = userAograCahce[userId]
  if (userCache) {
    return {error: 0, data: userCache}
  }

  return {error: 10004}
}


module.exports.getUserIdFromAgoraId = function(agoraId) {
  let userKeys = [...userAograCahce.entries()]
  .filter(({ 1: v }) => v === agoraId)
  .map(([k]) => k);

  if (userKeys.length != 1){
    return {error: 10002}
  }

  let userId = userKeys[0]
  return {error: 0, data: {userId:userId}}
}




