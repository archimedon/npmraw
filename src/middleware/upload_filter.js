"use strict";
require("babel-polyfill");


module.exports = (function () {
    var express = require('express');
    var router = express.Router();

    const multiparty = require('multiparty');
    const isUploadRegEx = new RegExp('(?:POST|PUT).*', 'i');
    const isProxyRegEx = new RegExp('^/cfs/*(.*)', 'i');

    const isUploadMethod = {
        test: (req) => {
            console.log("ctype: " + req.headers['content-type']);
            return isUploadRegEx.test(req.method) && req.headers['content-type'].startsWith('multipart/form-data');
        }
    }

    const isProxyPath = {
        test: (pathname, req) => {
            return isProxyRegEx.test(pathname);
        }
    }

    const needle = require('needle');
    const fs = require('fs');

    router.use(async function (req, res, next) {

        if (!isUploadMethod.test(req)) {
            next();
        }
        else {

            console.log('Time: %d', Date.now());

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

            const inpectForm = new Promise((resolve) => {



                const reqData = {};

                form.parse(req, (err, fields, files) => {
                    Object.keys(fields).forEach(function (name) {
                        uplargs[name] = encodeURIComponent(fields[name][0]);
                        console.log('got field named: ' + name);
                        console.log('got field value: ' + fields[name][0]);

                        reqData[name] = fields[name][0];
                    });
                    Object.keys(files).forEach(function (fileFieldKey) {
                        var file = files[fileFieldKey][0];
                        console.log('got file fileFieldKey ' + fileFieldKey);
                        console.log('got file fileFieldName ' + file.fieldName);
                        console.log('got file originalFilename ' + file.originalFilename);
                        console.log('got file path ' + file.path);
                        console.log('got file file.headers ' + JSON.stringify(file.headers));
                        console.log('got file file.size ' + file.size);

                        reqData[fileFieldKey] = {
                            buffer: fs.readFileSync(file.path),
                            filename: file.originalFilename || file.headers['filename'],
                            content_type: file.headers['content-type']
                        }
                    });
                    console.log('Upload completed!');
                    resolve(function (req) {
                        req.mdata = reqData;
                        req.ptarget = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
                        console.log('Url 1', req.ptarget);

                    }(req));
                });
            });
            await inpectForm
            next();
        }
    },
    function (req, res, next) {

        let targetURL = 'http://localhost:8080/cloudfs/api/v1' + req.ptarget;
        console.log('targetURL', targetURL);
        if (req.mdata) {
            needle.post(targetURL, req.mdata, { multipart: true }, function (err, resp, body) {
                res.end(JSON.stringify(body))
            });
        } else {
            next();
        }
    })

    return router;

})();
