const JWT = require('jsonwebtoken');
const createError = require('http-errors');

const client = require('../helper/init_redis');

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secrect = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: '1h',
                issuer: 'pickyourpage.com',
                audience: userId
            }
            JWT.sign(payload, secrect, options, (err, token) => {
                if (err) {
                    // reject(err); we can't directly send the error message to the client
                    // since this is an internal server error so we'll use http errors
                    console.log(err.message);
                    reject(createError.InternalServerError());
                }
                resolve(token);
            });
        })
    },
    // middleware
    verifyAccessToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return next(createError.Unauthorized());

        const bearer = authHeader.split(' ');
        const token = bearer[1];

        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
                return next(createError.Unauthorized(message));
            }
            req.payload = payload;
            next();
        })
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secrect = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: '1y',
                issuer: 'pickyourpage.com',
                audience: userId
            }
            JWT.sign(payload, secrect, options, async(err, token) => {
                if (err) {
                    // reject(err); we can't directly send the error message to the client
                    // since this is an internal server error so we'll use http errors
                    console.log(err.message);
                    reject(createError.InternalServerError());
                }

                // redis code to set the refresg token to the redis database for 1 year
                
                const expirationInSeconds = 365 * 24 * 60 * 60; // 1 year
                try {
                    await client.set(userId, token, {
                        EX: expirationInSeconds
                    });
                    console.log("Token set successfully in Redis");
                } catch (err) {
                    console.error(`Error setting token in Redis: ${err.message}`);
                    reject(createError.InternalServerError());
                }
                resolve(token);
            });
        })
    },
    verifyRefreshToken: (token) => {
        return new Promise((resolve, reject) => {
            JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, async(err, payload) => {
                if (err) reject(createError.Unauthorized());
                const userId = payload.aud;

                // redis code to get the refresh token by userId and validate that if it is a correct refresh token or not
                try {
                    const result = await client.get(userId);
                    if(result === token) resolve(userId);
                    reject(createError.Unauthorized());
                } catch (err) {
                    console.error(`Error setting token in Redis: ${err.message}`);
                    reject(createError.InternalServerError());
                }
                resolve(userId);
            })
        })
    }
}