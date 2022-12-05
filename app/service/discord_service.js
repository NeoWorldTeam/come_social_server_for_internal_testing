const { v4: uuidv4 } = require('uuid')
const user_service = require('./user_service.js')


var PROTO_PATH = __dirname + '/../protos/helloworld.proto';


const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

const client = new hello_proto.Greeter('localhost:50051',grpc.credentials.createInsecure())

const discordRequest = []

function findDiscordReq(requestId){
    let cardIndex = discordRequest.findIndex( o => o.requestId === requestId )
    if(cardIndex == -1){
        return null
    }
    return discordRequest[cardIndex]
}

module.exports.sendRequestToDiscord = function(userToken,appUrlScheme){
    let {error, data:currentUser} = user_service.getUser(userToken)
    if(error){
        return {error: error, data: null}
    }

    //创建临时连接
    let requestId = uuidv4()
    discordRequest.push({requestId:requestId,appUrlScheme:appUrlScheme,state:1,downloadUrl:"https://www.neoworld.cloud/"})


    client.sayHello({name: requestId}, function(err, response) {
        if(err){            
            return console.log(err)
        }
        let req = findDiscordReq(response.message)
        if(!req) return
        req.state = 0
        console.log('Greeting:', response.message)
    });

    return {error: 0,data: {discordReqId:requestId}}
}

module.exports.getAppURLSchemeFromDiscord = function(requestId){
    //查找是否存在
    let req = findDiscordReq(requestId)
    if(req){
        return {error: 0,data: req}
    }
    return {error: 10004,data: null}
}
