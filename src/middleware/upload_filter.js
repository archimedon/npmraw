
"use strict";
require("babel-polyfill");

// var express = require('express');

// var router = express.Router();

// router.get('/', function(req, res) {
//     res.send('GET handler for /dogs route.');
// });

// router.post('/', function(req, res) {
//     res.send('POST handler for /dogs route.');
// });

// module.exports = router;
let multiparty = require('multiparty');
const request = require('request');

const isUploadRegEx = new RegExp('(?:POST|PUT).*', 'i');
const isProxyRegEx = new RegExp('^/cfs/*(.*)', 'i');



const isUploadMethod = {
    test: (pathname, req) => {
        console.log("ctype: " + req.headers['content-type']);
        return isUploadRegEx.test(req.method) && req.headers['content-type'].startsWith('multipart/form-data');
    }
}

const isProxyPath = {
    test: (pathname, req) => {
        return isProxyRegEx.test(pathname);
    }
}

class UploadFilter {

    inpectForm (req) {
        return new Promise ( (resolve) => {

            let form = new multiparty.Form({
                encoding: "utf8",
                maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
                autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
                autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
            });



            
            form.parse(rq, (err, fields, files) => {

                const uplargs = {
                    bucketId: '',
                    author: encodeURIComponent('editor@org.com'),
                    destDir: ''
                };
    
                Object.keys(fields).forEach(function (name) {
                    uplargs[name] = encodeURIComponent(fields[name][0]);
                    console.log('got field named: ' + name);
                    console.log('got field value: ' + fields[name][0]);
                });
                console.log('Upload completed!');

                resolve(`/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`);
            });
        });
    }

    constructor(options) {

        this.options = options || {};
        this.options.aurl = '/freak'
        this.options.target = options.target || 'https://news.google.com/gn/news/?ned=us&gl=US&hl=en'

        if (!options.fsroute) this.options.fsroute = '/cfs';    
        if (!options.target) this.options.target = 'http://localhost:8080/cloudfs/api/v1';
        if (!options.changeOrigin) this.options.changeOrigin = false;
        if (!options.ws) this.options.ws = false;
    
        if (!options.pathRewrite) this.options.pathRewrite = async function(path, req) {
            let purl = '/junk'
            if (isProxyRegEx.test(path)) {
                purl = path.replace(isProxyRegEx, '/$1')
                console.log('isProxyRegEx pathRewrite= ' + purl);
            } else {
                console.log('making redir');
                purl = await this.inpectForm(req);
                console.log('purl', purl);
            }
            return purl;
        }

        
        // if (!options.onProxyReq) this.options.onProxyReq = async (proxyReq, req, res, options) => {

        //     purl = await this.inpectForm(req);
        //     console.log('purl', purl);

        //     // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
        // };

        if (!options.onProxyRes) this.options.onProxyRes = (proxyRes, req, res) => {
            let body = "";
    
            proxyRes.on('data', function (data) {
                data = data.toString('utf-8');
                body += data;
            })
    
            proxyRes.on('end', function (data) {
                try {
                    if (proxyRes.headers['content-type'].startsWith('application/json')) {
                        data = JSON.parse(body);
                        console.log("data:", data[0].downloadUrl);
                    } else {
                        data = body;
                    }
                } catch (err) { }
            })
        };
    
    }


    goog() {
        console.log('this.options', this.options);
        
        return new Promise(resolve => {
            request.get({uri: this.options.target}, function (error, gres, body) {
                resolve(body);
            });
         });
    }

    
    getProxy() {
        var filter = (pathname, req) => {
            var pathtest = isProxyPath.test(pathname, req);
            var methodtest = isUploadMethod.test(pathname, req);
            console.log("isProxyPath, '" + pathname + "' " + pathtest);
            console.log("isUploadMethod, '" + req.method + "' " + methodtest);
            return methodtest || pathtest;
        }
        const hpm = require('http-proxy-middleware')
        
        /**
         * Create the proxy middleware, so it can be used in a server.
         */
        return hpm(filter, this.options);
    }
    
}

module.exports = UploadFilter;


// parseForm(form, req) {


//     return new Promise(resolve => {
//         form.parse(req, (err, fields, files) => {
//             Object.keys(fields).forEach(function (name) {
//                 uplargs[name] = encodeURIComponent(fields[name][0]);
//                 console.log('got field named: ' + name);
//                 console.log('got field value: ' + fields[name][0]);
//             });
// //            Object.keys(files).forEach(function(fileFieldKey) {
// //                var file = files[fileFieldKey][0];
// //                console.log('got file fileFieldKey ' + fileFieldKey);
// //                console.log('got file fileFieldName ' + file.fieldName);
// //                console.log('got file originalFilename ' + file.originalFilename);
// //                console.log('got file path ' + file.path);
// //                console.log('got file file.headers ' + JSON.stringify(file.headers));
// //                console.log('got file file.size ' + file.size);
// //            });
            
//             purl = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;

//             console.log('Upload completed!');
//             console.log(`purl: ${purl}`);
//             resolve(purl);
//             //          res.setHeader('text/plain');
//             //          res.end('Received ' + files.length + ' files');
//         });
//         return purl;
//     });

// }
