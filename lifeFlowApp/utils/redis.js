const redis = require('redis');
const { promisify } = require("util");


const redisClient = redis.createClient(6379);
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', err => console.log('Redis Client Connect', err));

async function start() {
  await redisClient.connect();
}
start()


module.exports = redisClient;

// function Client() {
//   this.set = promisify(redisClient.set).bind(redisClient);
//   this.get = promisify(redisClient.get).bind(redisClient);
//   this.lPush = promisify(redisClient.lPush).bind(redisClient);
//   this.rPush = promisify(redisClient.rPush).bind(redisClient);
//   this.lLen = promisify(redisClient.lLen).bind(redisClient);
//   this.lRange = promisify(redisClient.lRange).bind(redisClient);
//   this.zAdd = promisify(redisClient.zAdd).bind(redisClient);
  
  
//   return this;
// }

// const client = new Client();



// module.exports = client