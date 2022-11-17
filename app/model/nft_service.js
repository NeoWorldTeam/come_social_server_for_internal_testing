const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')
const { exec,execSync } = require('child_process');
const path = require('path');

//用户卡片的列表
const generateNFTList = {}

function uint8arrayToStringMethod(myUint8Arr){
    return String.fromCharCode.apply(null, myUint8Arr);
}

//生成NFT
module.exports.generateNFT = function(userToken,chain_address,metadata){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }


    let nftId = uuidv4()
    generateNFTList[nftId] = {onwer: currentUser,progress: 0}

    let output = execSync('pwd', { cwd: path.join(process.cwd(), '../nft-tutorial') })
    console.log(uint8arrayToStringMethod(output))
    exec('npx hardhat run scripts/check_balance.js --network goerli', { cwd: path.join(process.cwd(), '../nft-tutorial') }, (err, stdout, stderr) => {
        let NFTGeneter = generateNFTList[nftId]
        if(NFTGeneter){
            if(err) {
                NFTGeneter.progress = -1
                console.log(err);
                return;
            }
            NFTGeneter.progress = 100
            console.log(`stdout: ${stdout}`);
        }

    });


    return {error: null,data: {makeNFTId:nftId}}
}

module.exports.queryProgress = function(userToken,nftId){
    let NFTGeneter = generateNFTList[nftId]
    if(NFTGeneter){
        return {error: null,data: {process:NFTGeneter.progress}}
    }

    return {error: 10004,data: null}
}


