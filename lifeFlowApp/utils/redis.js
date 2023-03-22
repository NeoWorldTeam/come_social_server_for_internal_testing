const redis = require('redis');
const { promisify } = require("util");
const config = require('../config');

const redisClient = redis.createClient(config.REDIS_PORT);

redisClient.on("error", function (err) {
  console.log("Error " + err);
});

function Client() {
  this.set = promisify(redisClient.set).bind(redisClient);
  this.get = promisify(redisClient.get).bind(redisClient);
  return this;
}

const client = new Client();

module.exports = client