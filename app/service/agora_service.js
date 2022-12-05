const dotenv = require('dotenv');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole} = require('agora-access-token');
dotenv.config();

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;


module.exports.generateRTCToken = (channelName, uid, role, privilegeExpireTime, tokentype = "uid") => {
    console.log(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime, tokentype)
    if (tokentype === 'userAccount') {
        const token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
        return {error: 0, data: {"token":token}}
      } else if (tokentype === 'uid') {
        const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
        return {error: 0, data: {"token":token}}
      } else {
        return {error: -10004, data: null}
      }
  }
  
  module.exports.generateRTMToken = (uid, role, privilegeExpireTime) => {
    // build the token
    console.log(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime)
    const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
    // return the token
    return {error: 0, data: {"rtmToken":token }};
  }


  //获取场的声网数据
module.exports.getAgoraInfo = function(userToken,fieldId) { 
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    
    let fieldIndex = lobbyTable.findIndex( o => o.id === fieldId )
    if(fieldIndex == -1){
        return {error: 10004, data: null}
    }

    return {error: 0, data: {channelName:"happy", token:"007eJxTYLhXuGYr2+1/ds5cWsZPL1kuanJvbnK8tyTvKBvjBFvDlj8KDKlJyZYGBhbGlgbGRiZJBiYWaYkGpslGhkB+iqFRsoW9d29yQyAjw+80TlZGBggE8VkZMhILCioZGAAw7h5p"}}
}