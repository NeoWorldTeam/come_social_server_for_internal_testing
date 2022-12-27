const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')


const { exec,execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const fp = require("fs-props");





//用户卡片的列表
const generateNFTList = {}

function uint8arrayToStringMethod(myUint8Arr){
    return String.fromCharCode.apply(null, myUint8Arr);
}

function createMetaData(nft_asset_url,name,videoAttributes) {
    let metadata = {}
    metadata.description = "Description for Come Social NFT"
    metadata.external_url = "https://www.neoworld.cloud/"
    metadata.name = name
    metadata.animation_url = nft_asset_url

    let mediameta = {}
    mediameta.uri = nft_asset_url
    mediameta.dimensions = videoAttributes.width + "x" + videoAttributes.height
    mediameta.mimeType = videoAttributes.mimeType
    mediameta.size = videoAttributes.size
    metadata.media = mediameta
    return metadata
}

//生成NFT
module.exports.generateNFT = function(userToken,chain_address,netowrkDomain,metadataPath,name){
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
        if(stderr) {
            return console.error(stderr);
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
            
            if (!name || name == ""){
                name = "CSNFT #"+tokenId
            }

            //mp4 file metadata
            // var fileInfo = fs.statSync(metadataPath);
            // var fileSize = fileInfo.size;
            // var videoAttributes = attributes(metadataPath)
            // console.log(videoAttributes);

            fp.props(metadataPath).then((properties) => {
                console.log(properties);
                //写配置
                fs.writeFile(nft_json_path, JSON.stringify(createMetaData(nft_asset_network,name,properties)),  function(err) {
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
            });


            
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


