const { v4: uuidv4 } = require('uuid');
const lobbySpatialAnchorCache = {};


module.exports.addSpatialAnchor = function(lobbyId,anchorId){
    var spatialAnchorCache = lobbySpatialAnchorCache[lobbyId];
    if (spatialAnchorCache == null) {
        spatialAnchorCache = new Array();
        lobbySpatialAnchorCache[lobbyId] = spatialAnchorCache;
    }

    spatialAnchorCache.push(anchorId);
    return spatialAnchorCache;
}

module.exports.getSpatialAnchor = function(lobbyId){
    let spatialAnchorCache = lobbySpatialAnchorCache[lobbyId];
    if (spatialAnchorCache != null) {
        return spatialAnchorCache ;
    }
    return [];
}

module.exports.deleteSpatialAnchor = function(lobbyId,anchorId){
    var spatialAnchorCache = lobbySpatialAnchorCache[lobbyId];
    if (spatialAnchorCache != null) {
        spatialAnchorCache.forEach(function(item, index, arr) {
            if(item == anchorId) {
                arr.splice(index, 1);
            }
        });
    }
    return spatialAnchorCache;
}
