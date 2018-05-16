"use strict";
require("babel-polyfill");

const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const needle = require('needle');
const fs = require('fs');
const URL = require('url');

class ProxyRoute {

    constructor(pathPattern, action) {
        this.method = action || 'GET'
        this.path = pathPattern
        this.parseReq = false
        // (proxyErr, proxyResp, proxyBody, req, res)
        this.parseResp = false
    }

    setMethod(methName) {
        this.method = methName
        return this;
    }

    asGet() {
        this.method = 'GET'
        return this;
    }

    asPost() {
        return this.setMethod('POST');
    }

    asPut() {
        return this.setMethod('PUT');
    }

    reqHandler(fn) {
        this.parseReq = fn;
        return this;
    }

    respHandler(fn) {
        this.parseResp = fn
        return this;
    }

    getMethod() {
        return this.method;
    }

    getPath() {
        return this.path;
    }

    writeProxyPath() {
        console.log("writeProxyPath " + this.parseReq)
        return this.parseReq;
    }

    getRespHandler() {
        return this.parseResp;
    }

    toString() {
        return [this.method, this.path].join(':');
    }
}

/***
 * options.proxy_route = ''
 * options.proxy_host = ''
 * options.req.pathRewrite = (req, reqData) => {}
 * options.parseProxyResponse = (proxyErr, proxyResp, proxyBody, req, res) => {}
 */
class UploadFilter {


    static initializeOpts(obj, opts) {
        obj.options = {};

        if (typeof opts == 'string') {
            obj.options.proxy_host = opts;
        } else {
            obj.options = opts;
        }

        obj.options.proxy_host = obj.options.proxy_host || 'http://localhost:8080/cloudfs/api/v1';

        if (!obj.options.proxyRoutes) obj.options.proxyRoutes = []

    }

    getPathPatterns() {
        let pats = this.options.proxyRoutes.map(proxyRoute => proxyRoute.getPath()).join("|");
        console.log('pats:' + pats)
        return pats;
    }

    getProxyRoutes() {
        return this.options.proxyRoutes;

        // this.customHandlers = {};

        // this.options.proxyRoutes.forEach((proxyRoute) => {
        //     this.customHandlers[proxyRoute.method + ':' + proxyRoute.path] = proxyRoute;
        // })

    }

    constructor(opts) {

        const self = this

        UploadFilter.initializeOpts(self, opts)


        this.isUploadRegEx = new RegExp('(?:POST|PUT|PATCH).*', 'i');



        // array.reduce(function(total, currentValue, currentIndex, arr), initialValue)
        // this.pathPattern = this.options.proxyRoutes.reduce( (tally, proxyRoute) => tally && proxyRoute.getPath(), '');
        // [new ProxyRoute()].map(proxyRoute => proxyRoute.getPath()).join("|");

        // new RegExp('^/(?:' + getPathPatterns() + ').*');
        // new RegExp('^/' + this.options.proxy_route || 'cfs' + '/*(.*)', 'i');

        // this.isProxyRegEx = new RegExp('^/' + this.options.proxy_route || 'cfs' + '/*(.*)', 'i');

        this.isProxyPath = {
            test: (pathname) => {
                return (new RegExp('^/(?:' + self.getPathPatterns() + ').*')).test(pathname);
            },
            exec: (pathname) => {
                return (new RegExp('((?:' + self.getPathPatterns() + ')).*')).exec(pathname);
            }
        }

        this.findProxyRoute = (req) => {
            let path = false;
            let match = self.isProxyPath.exec(req.originalUrl);
            console.log("req.originalUrl: " + req.originalUrl);
            console.log("match: " + match);

            if (match) {
                path = match.pop();
                console.log("path: " + path);
                console.log("proxyRoutes: " + this.options.proxyRoutes);
                console.log("req.method: " + req.method);

                let found = this.options.proxyRoutes.filter(elem => (elem.getPath() === path && elem.getMethod() === req.method)).pop();
                console.log("found: " + found);

                return found;
            }
            return false
        }

        this.isUploadMethod = {
            test: (req) => {
                console.log("ctype: " + req.headers['content-type']);
                return self.isUploadRegEx.test(req.method)
                    && (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data'));
            }
        }
    }

    setOption(key, val) {
        this.options[key] = val;
        return this;
    }

    addProxyRoute(path, method) {

        let proxyRoute = new ProxyRoute(path, method);
        this.options.proxyRoutes.push(proxyRoute)
        console.log("proxyRoute: " + proxyRoute);
        return proxyRoute;
    }

    getRoute() {
        const self = this

        router.use(async function (req, res, next) {
            let found = false;
            console.log("found " + found)

            if (self.isUploadMethod.test(req) || (found = self.findProxyRoute(req))) {
                req.found = found;
                console.log("found " + found)

                if (self.isUploadMethod.test(req)) {
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
                                console.log('file.size ' + file.size);

                                reqData[fileFieldKey] = {
                                    buffer: fs.readFileSync(file.path),
                                    filename: file.originalFilename || file.headers['filename'],
                                    content_type: file.headers['content-type']
                                }
                            });
                            console.log('Upload completed!');
                            resolve(function (req) {
                                req.mdata = reqData;

                                if (req.found) {
                                    req.respHandler = req.found.getRespHandler;
                                    req.proxy_path = req.found.writeProxyPath(req, reqData)
                                }
                                else {
                                    req.proxy_path = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;
                                }

                                console.log('resolve proxy_path', req.proxy_path);
                                return req.proxy_path;
                            }(req));
                        });
                    });
                    console.log("waited for: " + await inpectForm)
                } else {

                    console.log('no promise');
                    console.log('found:', req.found);

                    if (req.found) {
                        req.respHandler = req.found.parseResp;
                        req.proxy_path = req.found.parseReq(req)
                    }
                    else {
                        next();
                    }

                    console.log('proxy_path:', req.proxy_path);

                }
            } 
            next();
                
        
        },
            function (req, res, next) {
                let host = URL.parse(self.options.proxy_host)
                
                let targetURL = 
                   URL.resolve(self.options.proxy_host, req.proxy_path  ? req.proxy_path : req.originalUrl)

                   console.log('targetURL', targetURL);
                // console.log('mdata', JSON.stringify(req.mdata));

            
                switch (req.method) {
                    case 'GET':
                        needle.get(targetURL, function (proxyErr, proxyResp, proxyBody) {
                            req.respHandler
                                ? req.respHandler(proxyErr, proxyResp, proxyBody, req, res)
                                : (proxyResp.headers['content-type'] == 'application/json')
                                    ? JSON.stringify(proxyBody)
                                    : proxyBody
                        });
                        break;
                    case 'POST':
                        if (req.mdata) {
                            needle.post(targetURL, req.mdata, { multipart: true }, function (proxyErr, proxyResp, proxyBody) {
                                req.respHandler
                                    ? req.respHandler(proxyErr, proxyResp, proxyBody, req, res)
                                    : res.end(JSON.stringify(proxyBody))
                            });
                        }
                        break;
                    default:
                        needle(req.method, targetURL, req.mdata, function(proxyErr, proxyResp, proxyBody) {

                            req.respHandler
                                    ? req.respHandler(proxyErr, proxyResp, proxyBody, req, res)
                                    : res.end(JSON.stringify(!proxyErr ? proxyResp.body: err))
                        });
                }
            })
        return router;
    }
}

module.exports = UploadFilter;
