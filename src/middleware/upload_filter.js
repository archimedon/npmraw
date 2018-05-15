"use strict";
require("babel-polyfill");

const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const needle = require('needle');
const fs = require('fs');

 /***
  * options.proxy_route = ''
  * options.proxy_host = ''
  * options.req.pathRewrite = (req, reqData) => {}
  * options.parseProxyResponse = (proxyErr, proxyResp, proxyBody, req, res) => {}
  */
module.exports = (function (opts) {
   
    let options = {};

    if (typeof opts == 'string') {
       options.proxy_host = opts;
    } else {
        options = opts;
    }
    const customHandlers = {};

    if (options.proxyRoutes) {
        options.proxyRoutes.forEach((trigger) => {
            customHandlers[trigger.method + ':' + trigger.path] = trigger;
        })
    }

    options.proxy_host = options.proxy_host || 'http://localhost:8080/cloudfs/api/v1';

    const isUploadRegEx = new RegExp('(?:POST|PUT|PATCH).*', 'i');

    
    options.proxyRoutes.forEach((trigger) => {
        customHandlers[trigger.method + ':' + trigger.path] = trigger;
    })
    
    const isProxyRegEx = new RegExp('^/' + options.proxy_route || 'cfs' + '/*(.*)', 'i');

    const isUploadMethod = {
        test: (req) => {
            console.log("ctype: " + req.headers['content-type']);
            return isUploadRegEx.test(req.method) && req.headers['content-type'].startsWith('multipart/form-data');
        }
    }

    const isProxyPath = {
        test: (pathname) => {
            return isProxyRegEx.test(pathname);
        }
    }

    router.use(async function (req, res, next) {

        if (isUploadMethod.test(req) || isProxyPath(req.originalUrl)) {


            const inpectForm = new Promise((resolve) => {

                const reqData = {};
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

                form.parse(req, (err, fields, files) => {
                    Object.keys(fields).forEach(function (name) {
                        uplargs[name] = encodeURIComponent(fields[name][0]);
                        console.log('got field named: ' + name);
                        console.log('got field value: ' + fields[name][0]);

                        reqData[name] = fields[name][0];
                    });
                    Object.keys(files).forEach(function (fileFieldKey) {
                        var file = files[fileFieldKey][0];
                        
                        // console.log('fileFieldKey ' + fileFieldKey);
                        // console.log('fileFieldName ' + file.fieldName);
                        // console.log('originalFilename ' + file.originalFilename);
                        // console.log('path ' + file.path);
                        // console.log('file.headers ' + JSON.stringify(file.headers));
                        // console.log('file.size ' + file.size);

                        reqData[fileFieldKey] = {
                            buffer: fs.readFileSync(file.path),
                            filename: file.originalFilename || file.headers['filename'],
                            content_type: file.headers['content-type']
                        }
                    });
                    console.log('Upload completed!');
                    resolve(function (req) {
                        req.mdata = reqData;


                        req.proxy_path = options.pathRewrite ? options.pathRewrite(req, reqData) : `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
                        console.log('proxy_path', req.proxy_path);

                    }(req));
                });
            });
            await inpectForm
        }
        next();
    },
    function (req, res, next) {
        const targetURL = options.proxy_host + req.proxy_path;
        console.log('targetURL', targetURL);
        if (req.mdata) {
            needle.post(targetURL, req.mdata, { multipart: true }, function (proxyErr, proxyResp, proxyBody) {
                options.parseProxyResponse ? options.parseProxyResponse(proxyErr, proxyResp, proxyBody, req, res) : res.end(JSON.stringify(proxyBody))
            });
        } else {
            next();
        }
    })
    return router;
});
