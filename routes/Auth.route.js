const express = require('express');
const router = express.Router();

const {authSchema} = require('../helper/validation_schema');

const User = require('../models/User.model')
const createError = require('http-errors');
const {signAccessToken, signRefreshToken, verifyRefreshToken} = require('../helper/jwt_helper');


router.post('/register', async (req, res, next) => {
    try {
        // const { email, password } = req.body;

        // check required fields are present or not
        // if (!email || !password) throw createError.BadRequest();
        const result = await authSchema.validateAsync(req.body);

        // check if the user is already present or not
        const isExist = await User.findOne({email: result.email});
        if(isExist)
            throw createError.Conflict(`${result.email} is already been registered!`);

        const user = new User(result);
        const savedUser = await user.save();

        // here we have to generate the access token and send back to the client
        const accessToken = await signAccessToken(savedUser.id);
        const refreshToken = await signRefreshToken(savedUser.id);
        res.send({accessToken: accessToken, refreshToken: refreshToken});
        
    } catch (error) {
        if(error.isJoi === true) next(createError.BadRequest("Invalid email or password"))
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body);
        const user = await User.findOne({email: result.email});
        if(!user) throw createError.NotFound("User not registered!");

        const isValid = await user.isValidPassword(result.password);
        console.log(isValid);
        if(!isValid) throw createError.Unauthorized("Email/Password not valid!");

        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);
        res.send({accessToken: accessToken, refreshToken: refreshToken});
    } catch (error) {
        if(error.isJoi === true)
            return next(createError.BadRequest("Invalid email/password!"));
        next(error);
    }
})

router.post('/logout', async (req, res, next) => {
    res.send("response from logout route")
})

router.post('/refresh-token', async (req, res, next) => {
    try {
        const {refreshToken} = req.body;
        if(!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);
        const newAccessToken = await signAccessToken(userId);
        const newRefreshToken = await signRefreshToken(userId);
        res.send({accessToken: newAccessToken, refreshToken:newRefreshToken});
    } catch (error) {
        next(error)
    }
})


module.exports = router;