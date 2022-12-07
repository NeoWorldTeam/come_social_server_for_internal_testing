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
        
        // 1 面具卡
        cardList.push({id:uuidv4(),name:"Blue Hair Boy",count:-1,type:1,coverURL: "res/img/mask_1/card_cover.png",backCoverURL: "res/img/mask_1/card_back_cover.png",ownerId:userId})
        cardList.push({id:uuidv4(),name:"Blond Girl",count:-1,type:1,coverURL: "res/img/mask_2/card_cover.png",backCoverURL: "res/img/mask_2/card_back_cover.png",ownerId:userId})
        cardList.push({id:uuidv4(),name:"African Style",count:-1,type:1,coverURL: "res/img/mask_3/card_cover.png",backCoverURL: "res/img/mask_3/card_back_cover.png",ownerId:userId})
        cardList.push({id:uuidv4(),name:"Smirky Cat",count:-1,type:1,coverURL: "res/img/mask_4/card_cover.png",backCoverURL: "res/img/mask_4/card_back_cover.png",ownerId:userId})
        // 2 Party卡
        cardList.push({id:uuidv4(),name:"Wigggle Time",count:-1,type:2,coverURL: "res/img/party_1/card_cover.png",backCoverURL: "res/img/party_1/card_back_cover.png",ownerId:userId})
        // 3 NFT铸造卡
        cardList.push({id:uuidv4(),name:"Make CS NFT",count:-1,type:3,coverURL: "res/img/make_nft_1/card_cover.png",backCoverURL: "res/img/make_nft_1/card_back_cover.png",ownerId:userId})
        // 4 Discord 邀请卡
        cardList.push({id:uuidv4(),name:"Invite your friends via discord",count:-1,type:4,coverURL: "res/img/discord_1/card_cover.png",backCoverURL: "res/img/discord_1/card_back_cover.png",ownerId:userId})
        // 5 NFT卡
        cardList.push({id:uuidv4(),name:"Nicki",count:-1,type:5,coverURL: "res/img/nft_1/card_cover.png",backCoverURL: "res/img/nft_1/card_back_cover.png",ownerId:userId})
        // 6 airdorp
        cardList.push({id:uuidv4(),name:"Airdorp",count:-1,type:6,coverURL: "res/img/airdrop_1/card_cover.png",backCoverURL: "res/img/airdrop_1/card_back_cover.png",ownerId:userId})

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

