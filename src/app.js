"use strict";
require("babel-polyfill");

// import http from 'http';
import express from 'express';
import config from './config.json';
import logger from 'morgan';

import UploadFilter from './middleware/upload_filter.js';

const asyncHandler = require('express-async-handler')
const request = require('request')

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

app.use('/fmgr', require('./routes/fmgr'));
const passThruFn = (proxyErr, proxyResp, proxyBody, req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(proxyBody));
};

const uploadFilter = new UploadFilter({
    proxy_host: 'http://dev.rasajournal.com'
    // proxy_host: 'http://localhost:8080/cloudfs/api/v1'
    // proxy_host: 'https://news.google.com/gn/news/?ned=us&gl=US&hl=en'

    
})
//         'access-control-allow-methods': 'ACCEPT, PROPFIND, PROPPATCH, COPY, MOVE, DELETE, MKCOL, LOCK, UNLOCK, PUT, GETLIB, VERSION-CONTROL, CHECKIN, CHECKOUT, UNCHECKOUT, REPORT, UPDATE, CANCELUPLOAD, HEAD, OPTIONS, GET, POST',

let davRoute = uploadFilter
    .addProxyRoute('/dav').asGet()
    .reqHandler((req, reqData) => req.originalUrl.replace(davRoute.path, '/PUBLISHER') )
    .respHandler( (proxyErr, proxyResp, proxyBody, req, res) => {
        // let localRefPattern = new RegExp('((?:src|href))="/PUBLISHER([^\'|"]+)"$2"', "i");
        // .replace(localRefPattern, "$1=$2/da")
        console.log('headers', proxyResp.headers)
        // proxyResp.pipe(res)
        // 'content-type': 'text/html;charset=ISO-8859-1'

        res.end(
            proxyResp.headers['content-type'].startsWith('application/json')
            ? JSON.stringify(proxyBody)
            //str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            : proxyResp.headers['content-type'].startsWith('text/html')
                ? proxyBody.replace(/\/PUBLISHER/g, davRoute.path)
                : proxyBody
        );
    });
console.log("uploadFilter: " + uploadFilter.getProxyRoutes());

app.use(uploadFilter.getRoute());

const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;


// const uploadFilter = new UploadFilter({ target: 'https://news.google.com/gn/news/?ned=us&gl=US&hl=en' });
// const hpm = require('http-proxy-middleware')
// const multiparty = require('multiparty');



 
// express.get('/', asyncHandler(async (req, res, next) => {

// app.get('/test', asyncHandler(async (req, res, next) => {
    
//     let str = await uploadFilter.goog();
//     console.log("str : " + str)
//     res.end("str : " + str)

// //     res.end(uploadFilter.goog())
// //     // const fetchResult = request('https://www.reddit.com/r/javascript/top/.json?limit=5')
// //     // uploadFilter.goog().then(rem => rem.pipe(res));
// //     res.end(uploadFilter.goog())

// }));


// app.use(UploadFilter());
// function read(req, ask) {

//     function former(req) {
//         return new Promise(resolve => {
//             let form = new multiparty.Form({
//                 encoding: "utf8",
//                 maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
//                 autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
//                 autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
//             });

//             let uplargs = {
//                 bucketId: '',
//                 destDir: '',
//                 author: encodeURIComponent('editor@org.com')
//             };
//             let purl = 'non'

//             let tmp = 'non'
//             setTimeout(() => resolve(
//                 form.parse(req, (err, fields, files) => {
//                     Object.keys(fields).forEach(function (name) {
//                         uplargs[name] = encodeURIComponent(fields[name][0]);
//                         console.log('got field named: ' + name);
//                         console.log('got field value: ' + fields[name][0]);
//                     });
//                     tmp = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
//                 })
//             ), 2000);



//             console.log('Upload completed!');
//             console.log(`purl: ${tmp}`);
//             //          res.setHeader('text/plain');
//             //          res.end('Received ' + files.length + ' files');
//         });
//     }

//     return former(req)
// }

// function resin(req, res) {
//     let form = new multiparty.Form({
//         encoding: "utf8",
//         maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
//         autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
//         autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
//     });

//     let uplargs = {
//         bucketId: '',
//         destDir: '',
//         author: encodeURIComponent('editor@org.com')
//     };

//     let tmp = 'non'
//     form.parse(req, (err, fields, files) => {
//         Object.keys(fields).forEach(function (name) {
//             uplargs[name] = encodeURIComponent(fields[name][0]);
//             console.log('got field named: ' + name);
//             console.log('got field value: ' + fields[name][0]);
//         });
//         tmp = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
//         res.end('Received ' + tmp);
//     })
// }

// const asyncHandler = require('express-async-handler')
// const request = require('request')

// app.get('/test', (req, res) => {
//     // const fetchResult = request('https://www.reddit.com/r/javascript/top/.json?limit=5')
//     // uploadFilter.goog().then(rem => rem.pipe(res));
//     res.end(uploadFilter.goog())
// })


 
// express.get('/', asyncHandler(async (req, res, next) => {
//     const bar = await resin(req, res);
//     res.send(bar)
// }))

// app.use(function (req, res, next) {
//     console.log('Time: %d', Date.now());
//     next();
//   });
// const server = app.listen(process.env.PORT || config.port, () => {
//     console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
// });

// export default app;


// let start = new Promise((resolve, reject) => resolve("start"))
// let middle = new Promise((resolve, reject) => {
//   setTimeout(() => resolve(" middle"), 1000)
// })
// let end = new Promise((resolve, reject) => resolve(" end"))

// Promise.all([start, middle, end]).then(results => {
//   $("#output").append(results[0])
//   $("#output").append(results[1])
//   $("#output").append(results[2])
// })
// }