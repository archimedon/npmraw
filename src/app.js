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

class Rectangle {
    constructor(height, width) {
        this.height = height;
        this.width = width;
    }


    get goog() {
        return new Promise(resolve => {
            resolve(request('https://news.google.com/gn/news/?ned=us&gl=US&hl=en'))
        });
    }
}

app.get('/test', (req, res) => {
    new Rectangle().goog.then(rem => rem.pipe(res));
});

const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;

