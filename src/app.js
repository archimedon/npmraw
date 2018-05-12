"use strict";
// import http from 'http';
import express from 'express';
import config from './config.json';
import logger from 'morgan';
import UploadFilter from './middleware/upload_filter.js';

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


const uploadFilter = new UploadFilter({ target: 'https://news.google.com/gn/news/?ned=us&gl=US&hl=en'});
const hpm = require('http-proxy-middleware')
const multiparty = require('multiparty');

app.get('/test', (req, res) => {
    uploadFilter.goog().then(rem => rem.pipe(res));
});


// app.use(uploadFilter.getProxy());
function read(req, ask) {

    function former(req) {
        return new Promise(resolve => {
            let form = new multiparty.Form({
                encoding: "utf8",
                maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
                autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
                autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
            });
            
            let uplargs = {
                bucketId: '',
                destDir: '',
                author: encodeURIComponent('editor@org.com')
            };
            let purl = 'non'
        
             let tmp = 'non'
             setTimeout(() => resolve(
                form.parse(req, (err, fields, files) => {
                    Object.keys(fields).forEach(function (name) {
                    uplargs[name] = encodeURIComponent(fields[name][0]);
                    console.log('got field named: ' + name);
                    console.log('got field value: ' + fields[name][0]);
                    });
                    tmp = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
            })                 
             ), 2000); 
                
                             

                console.log('Upload completed!');
                console.log(`purl: ${tmp}`);
                //          res.setHeader('text/plain');
                //          res.end('Received ' + files.length + ' files');
        });
    }
    
    return former(req)
}

app.post('/fmgr', (req, res) => {
    let cal = {
        val : 'empty',
        store: (val) => { cal.val = val}
    };
    read(req, cal).then(dt => {cal.store(dt + 'ggg')})

    res.end(cal.val)
});

const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;

