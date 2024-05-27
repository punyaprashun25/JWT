const redis = require('redis');

const client = redis.createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.on('connect', () => {
    console.log("Client connected to the Redis!");
});

client.on('ready', () => {
    console.log("Client connected to Redis and ready to use!");
});

client.on('error', (err) => {
    console.log(`Redis error: ${err.message}`);
});

client.on('end', () => {
    console.log("Disconnected from Redis!");
});

process.on('SIGINT', () => {
    client.quit().then(() => {
        console.log("Client closed gracefully");
        process.exit(0);
    }).catch((err) => {
        console.error(`Error closing Redis client: ${err.message}`);
        process.exit(1);
    });
});

(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error(`Error connecting to Redis: ${err.message}`);
    }
})();

module.exports = client;
