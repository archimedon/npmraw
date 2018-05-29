"use strict";
require("babel-polyfill");

// import http from 'http';
import express from 'express';
import config from './config.json';
import logger from 'morgan';

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
let dat = config.dat;
dat.author_posts = {}
dat.posts.forEach(element => {
    let aid = parseInt(element.post_author);
    if (! dat.author_posts[aid]) dat.author_posts[aid] = [];
    dat.author_posts[aid].push(element);
});
dat.categories.map(category => 
    category.label = (category.parentName ?  '/<code>' + category.parentName + '</code>' : '') + '/<code>' + category.name + '</code>'
);
// request.get('http://localhost/wp-content/uploads/categories.json', function(error, response, body){
//     if(error) console.log(error);
//     dat.categories = JSON.parse(body);
//     console.log(body)
// })

// request('http://localhost/wp-content/uploads/authors.json', function(error, response, body){
//     if(error) console.log(error);
//     console.log(body)
//     dat.authors = JSON.parse(body);
// })

// request('http://localhost/wp-content/uploads/articles.json', function(error, response, body){
//     if(error) console.log(error);
//     dat.posts = JSON.parse(body);
//     dat.author_posts = {}
//     dat.posts.forEach(element => {
//         let aid = parseInt(element.post_author);
//         if (! dat.author_posts[aid]) dat.author_posts[aid] = [];
//         dat.author_posts[aid].push(element);
//     });
    
// })

app.get('/cms', async (req, res) => {
    res.render('cms', dat)
})
app.get('/', async (req, res) => {
    res.render('index', dat)
});

// let author_post_renderFn = pug.compileFile('pug_parts/author_posts.pug')


// viewed at http://localhost:8080
// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/index.html'));
// });

// res.writeHead(200, {'Content-Type': 'text/html'});
// fs.createReadStream('index.html').pipe(res);


app.get('/author', async (req, res) => {
    res.render('hyperlist', {'authors': dat.authors})
});

app.get('/author/:aid/post', async (req, res) => {
    let author = dat.authors.find( element => element.ID == req.params.aid );
    console.log('author', author);
    res.render('author_posts', {'author': author, 'posts': dat.author_posts[req.params.aid]})
});

// app.get('/posts/authors/:aid', async (req, res) => {
//     let author = dat.authors.find( element => element.ID == req.params.aid );
//     console.log('author', author);
//     res.render('new_post_form', {'author': author})
// });

// // var multer   =  require( 'multer' );
// // var upload   =  multer( { dest: 'uploads/' } );
// var bodyParser = require('body-parser')

// // parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: true }))

// // parse application/json
// app.use(bodyParser.json())

// // parse application/vnd.api+json as json
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
const multiparty = require('multiparty');
const fs = require('fs');
var util = require('util');

app.post( '/posts/authors/:aid', function( req, res, next ) {
    const reqData = {};
    var form = new multiparty.Form({
        encoding: "utf8",
        autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
        autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
    });

    form.parse(req, (err, fields, files) => {
        Object.keys(fields).forEach(function (name) {
            console.log('got field named: ' + name);
            console.log('got field value: ' + fields[name][0]);
            reqData[name] = fields[name];
        });
        Object.keys(files).forEach(function (fileFieldKey) {
            var file = files[fileFieldKey][0];
            reqData[fileFieldKey] = {
                // buffer: fs.readFileSync(file.path),
                filename: file.originalFilename || file.headers['filename'],
                content_type: file.headers['content-type']
            }
        })
        console.log('reqData', JSON.stringify(reqData));

    res.end(JSON.stringify(reqData));
    });
    
            // console.log('fileFieldKey ' + fileFieldKey);
            // console.log('fileFieldName ' + file.fieldName);
            // console.log('originalFilename ' + file.originalFilename);
            // console.log('path ' + file.path);
            // console.log('file.headers ' + JSON.stringify(file.headers));
    // res.writeHead(200);
    // console.log(req.method);
    // console.log(req.headers);
    // console.log(req.url);
    
    // var data = '';
    // req.on('data', function(chunk) {
    //     data += chunk.toString();
    // });
    // req.on('end', function() {
    //     console.log(data);
    //     res.write('hi');
    //     res.end();
    // });
});

// const needle = require('needle');
// const fs = require('fs');
// const URL = require('url');

// app.post('/posts/authors/:aid', async (req, res) => {
//     let author = dat.authors.find( element => element.ID == req.params.aid );
//     console.log('author', author);
//     res.render('new_post_form', {'author': author})
// });


const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;

