const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')

//用户卡片的列表
const userCardMap = {}



let getUserCardList = function (userId) {
    var cardList = userCardMap[userId]
    if(!cardList){
        cardList = []
        let domain = process.env.DOMAIN
        console.log("domain is ",domain)
        //初始化卡片
        cardList.push({id:uuidv4(),name:"Aaron's Head",count:-1,type:1,coverURL: "res/img/facemask.png",backCoverURL: "res/img/facemask.png",ownerId:userId})
        cardList.push({id:uuidv4(),name:"Light Stage",count:-1,type:2,coverURL: "res/img/partycover.png",backCoverURL: "res/img/partycover.png",ownerId:userId})

        cardList.push({id:uuidv4(),name:"XXX's NFT",count:-1,type:3,coverURL: "res/img/nftcover.png",ownerId:userId})
        cardList.push({id:uuidv4(),name:"Discord Invite",count:-1,type:4,coverURL: "res/img/discordcover.png",backCoverURL: "res/img/discordback.png",ownerId:userId})

        userCardMap[userId] = cardList
    }

    return cardList
}


//卡片列表
module.exports.cardList = function(userToken,page,numPerPage){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    var cardList = getUserCardList(currentUser.id)
    if (!page) page = 0
    if (!numPerPage) numPerPage = 10
    let startIndex = numPerPage * page
    if(startIndex > cardList.length){
        return {error: 10003,data: null}
    }
    let endIndex = Math.min(startIndex + numPerPage,cardList.length)
    let result = cardList.slice(startIndex, endIndex)
    return {error: null,data: result}
}



//删除卡片
module.exports.deleteCard = function(userToken,cardId) { 
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    

    let cardList = getUserCardList(currentUser.id)
    let cardIndex = cardList.findIndex( o => o.id === cardId )
    if(cardIndex == -1){
        return {error: 0, data: null}
    }

    if(cardList[cardIndex].ownerId == currentUser.id){
        cardList.splice(cardIndex, 1)
        return {error: 0, data: null}
    }else{
        return {error: 10005, data: null}
    }
}


//赠送卡片
module.exports.presentCard = function(userToken,cardId,receiveUserId) { 
    //验证自己
    var {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }    
    //验证接受者
    var {error, data:receiveUser} = user_service.getUser(userToken,receiveUserId)
    if(error){
        return {error: 10004, data: null}
    }



    let cardList = getUserCardList(currentUser.id)

    //查找卡片是否存在
    let cardIndex = cardList.findIndex( o => o.id === cardId )
    if(cardIndex == -1){
        return {error: 10004, data: null}
    }

    let giftCard = cardList[cardIndex]
    //校验卡片是否可以被赠送
    if(giftCard.type < 1000) {
        return {error: 10006, data: null}
    }

    //验证卡片归属
    if(giftCard.ownerId == currentUser.id){
        //赠送的操作
        cardList.splice(cardIndex, 1)
        let recevieCardList = getUserCardList(receiveUserId)
        recevieCardList.push(giftCard)
        giftCard.ownerId = receiveUserId

        return {error: 0, data: null}
    }else{
        return {error: 10005, data: null}
    }
}

//创建卡
module.exports.creadCard = function(userToken,name,type,covertUrl) { 
    //验证自己
    var {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    let cardList = getUserCardList(currentUser.id)
    let card = {id:uuidv4(),name:name,count:1,type:type,cardCoverUrl:covertUrl,ownerId:currentUser.id}
    cardList.push(card)
    return {error: 0, data: card}
}

