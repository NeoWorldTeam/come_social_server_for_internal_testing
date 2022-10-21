const { v4: uuidv4 } = require('uuid');
const lobbyCache = {};


module.exports.lobbyList = function(){
    return Object.values(lobbyCache);
}

module.exports.getLobby = function(lobbyId){
    let lobby = lobbyCache[lobbyId];
    if (lobby != null) {
        return lobby ;
    }
    return {};
}

module.exports.createLobby = function(user,lobbyName) { 
    var lobbyId = uuidv4();
    var lobbyObj = {};

    lobbyObj.lobbyId = lobbyId;
    lobbyObj.name = lobbyName;
    lobbyObj.creater = user;
    lobbyObj.player = {};
    lobbyObj.player[user.userId] = user;
    lobbyObj.roomRealTime = {channelName:"happy", token:"007eJxTYAiYUT7596K5/ol55w9FGzJMFJCZc2XRm8y2G/EvfXKlN7krMKQmJVsaGFgYWxoYG5kkGZhYpCUamCYbGQL5KYZGyRZt9kHJDYGMDKeMZVkZGSAQxGdlyEgsKKhkYAAAXOIexQ=="}
    
    lobbyCache[lobbyId] = lobbyObj;
    return lobbyObj;
}

module.exports.closeLobby = function(user,lobbyId) { 
    var lobbyObj = lobbyCache[lobbyId];
    if(lobbyObj != null && user.userId == lobbyObj.creater.userId){
        delete lobbyCache[lobbyId];
        return lobbyObj;
    }
    return {};
}

module.exports.JoinLobby = function(user,lobbyId) { 
    var lobbyObj = lobbyCache[lobbyId];
    if(lobbyObj != null){
        var player = lobbyObj.player[user.userId];
        if(player == null){
            lobbyObj.player[user.userId] = user;
        }
        return lobbyObj;
    }
    return {};
}

module.exports.QuitLobby = function(user,lobbyId) { 
    var lobbyObj = lobbyCache[lobbyId];
    if(lobbyObj != null){
        var player = lobbyObj.player[user.userId];
        if(player != null){
            lobbyObj.player[user.userId] = null;
            return true;
        }
    }
    return false;
}