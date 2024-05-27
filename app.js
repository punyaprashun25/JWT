const express = require('express');
const morgan = require('morgan');

const createError = require('http-errors');

require('dotenv').config();

const authRoute  = require('./routes/Auth.route');
require('./helper/init_mongodb')

const {verifyAccessToken} = require('./helper/jwt_helper');

const client = require('./helper/init_redis')

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/auth', authRoute)

app.get('/', verifyAccessToken, async(req, res,next)=>{
    res.send("Hello from the server!");
});


app.use((req, res, next)=>{
    next(createError.NotFound("This route doesn't exist!"));
});

app.use((err, req, res, next)=>{
    res.status(err.status || 500);
    res.send({
        error:{
            status: err.status || 500,
            message: err.message
        }
    })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
    console.log(`Server running on the port ${PORT}`);
})