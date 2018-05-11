// import http from 'http';
import express from 'express';
import config from './config.json';
import logger from 'morgan';
var createError = require('http-errors');
var path = require('path');

let app = express();

// logger
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

// Views template engine
app.engine('pug', require('pug').__express)
app.set('views', __dirname + '/views')
app.set('view engine', 'pug');

// Static pages
app.use(express.static(__dirname + '/public'))  // static directory

app.use('/fmgr', require('./routes/fmgr'))

const request = require('request');

const UploadFilter = require('./middleware/upload_filter.js');


app.get('/test', (req, res) => {
    new UploadFilter().goog.then(rem => rem.pipe(res));
});

const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;

