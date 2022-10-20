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
    lobbyObj.roomRealTime = {channelName:"happy", token:"007eJxTYKg2XPDlZ5X6cvOAyqwt33k+Rn5fuf6e3P2PKcrM1as3PopXYEhNSrY0MLAwtjQwNjJJMjCxSEs0ME02MgTyUwyNki0mvQ1Irg9kZJBhzGVkZIBAEJ+VISOxoKCSgQEA6TMgkg=="}
    
    lobbyCache[lobbyId] = lobbyObj;
    return lobbyObj;
}

module.exports.closeLobby = function(user,lobbyId) { 
    var lobbyObj = lobbyCache[lobbyId];
    if(lobbyObj != null && user.userId == lobbyObj.creater.userId){
        lobbyCache[lobbyId] = null;
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