const { v4: uuidv4 } = require('uuid');
const nameCache = {}; 
var userAgoraIdIndex = 0


module.exports.generateUser = function(userName) { 
    var userObj = null;
    do{

        if (userName != null) {
            userObj = nameCache[userName]
            if(userObj != null){
                break;
            }
        }

        var userId = uuidv4();
        if(userName == null){
            userName = userId;
        }


        userObj = {"userId":userId,"name":userName,"agoraId":userAgoraIdIndex++};
        nameCache[userName] = userObj;
    }while(false);
    return userObj;
}