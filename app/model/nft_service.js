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

function createMetaData(nft_asset_url) {
    let metadata = {}
    metadata.description = "Come Socail NFT"
    metadata.external_url = "http://45.32.32.246/uploads/index.html"
    metadata.name = "XXXXXX"
    metadata.animation_url = nft_asset_url
    return metadata
}

//生成NFT
module.exports.generateNFT = function(userToken,chain_address,netowrkDomain,metadataPath){
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
    let localPath = process.cwd()
    let nftProjectPath = path.join(localPath, '../csnft')
    // let workPath = "/Users/fuhao/Documents/workspace/ethereum/nft-tutorial"
    let workPath = nftProjectPath
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

        var mintCommand = "npx hardhat mint"
        if(chain_address) {
            mintCommand = mintCommand + " --address " + chain_address
        }
        mintCommand += " --network goerli"
        //2. 创建NFT
        exec(mintCommand, { cwd: workPath }, (err, stdout, stderr) => {
            if(err) {
                NFTGeneter.progress = -1
                return console.error(err);
            }
            NFTGeneter.progress = 70
            
            //3.创建元数据
            let nft_asset_path = localPath + "/app/public/uploads/nft/assets/" + tokenId + ".mp4"
            let nft_json_path = localPath + "/app/public/uploads/nft/" + tokenId
            let nft_asset_network = netowrkDomain + "/uploads/nft/assets/" + tokenId + ".mp4"
            // let nft_json_network = netowrkDomain + "/app/public/uploads/nft/" + tokenId
            
            //写配置
            fs.writeFile(nft_json_path, JSON.stringify(createMetaData(nft_asset_network)),  function(err) {
                if (err) {
                    NFTGeneter.progress = -1
                    return console.error(err);
                }
                //写资源
                fs.rename(metadataPath, nft_asset_path, function (err) {
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


