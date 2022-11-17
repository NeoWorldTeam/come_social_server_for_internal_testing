const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')


const { exec,execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
// const util = require('util');


// const csExecFile = util.promisify(exec);
// const csWriteFile = util.promisify(fs.writeFile);



//用户卡片的列表
const generateNFTList = {}

function uint8arrayToStringMethod(myUint8Arr){
    return String.fromCharCode.apply(null, myUint8Arr);
}

function createMetaData(nft_asset_path) {
    let metadata = {}
    return metadata
}

//生成NFT
module.exports.generateNFT = function(userToken,chain_address,metadata){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }


    let nftId = uuidv4()
    generateNFTList[nftId] = {onwer: currentUser,progress: 0}

    
    
    // let output = execSync('pwd', { cwd: path.join(process.cwd(), '../nft-tutorial') })
    // console.log(uint8arrayToStringMethod(output))

    //1. 查询ID
    // let workPath = path.join(process.cwd(), '../nft-tutorial')
    let workPath = "/Users/fuhao/Documents/workspace/ethereum/nft-tutorial"
    exec('npx hardhat totalSupply --network goerli', { cwd: workPath }, (err, stdout, stderr) => {
        let NFTGeneter = generateNFTList[nftId]
        if(!NFTGeneter) {
            return
        }
        NFTGeneter.progress = -1
        if(err) {
            return console.error(err);
        }

        let tokenId = parseInt(stdout)
        if(!tokenId) {
            return
        }
        NFTGeneter.progress = 30


        //2. 创建NFT
        exec('npx hardhat mint --address=${chain_address} --network goerli', { cwd: workPath }, (err, stdout, stderr) => {
            if(err) {
                NFTGeneter.progress = -1
                return console.error(err);
            }
            
            //3.创建元数据
            let nft_asset_path = path.join(__dirname, 'public/uploads/nft/asset/').join(tokenId)
            let nft_json_path = path.join(__dirname, 'public/uploads/nft/').join(tokenId)
            
            //写配置
            fs.writeFile(nft_json_path, JSON.stringify(createMetaData(nft_asset_path)),  function(err) {
                if (err) {
                    NFTGeneter.progress = -1
                    return console.error(err);
                }
                //写资源
                fs.rename(metadata, nft_asset_path, function (err) {
                    if(err) {
                        NFTGeneter.progress = -1
                        return console.error(err);
                    }

                    NFTGeneter.progress = 100
                })
            })
        })

    })


    return {error: null,data: {makeNFTId:nftId}}
}

module.exports.queryMakeNFT = function(userToken,nftId){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }



    let NFTGeneter = generateNFTList[nftId]
    if(NFTGeneter && NFTGeneter.onwer.id == currentUser.id){
        return {error: null,data: { process: NFTGeneter.progress }}
    }

    return {error: 10004,data: null}
}


