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


const proxyBuilder = (options) => {

    const hpm = require('http-proxy-middleware');

    options = options || {};

    if (!options.fsroute) options.fsroute = '/cfs';

    if (!options.target) options.target = 'http://localhost:8080/cloudfs/api/v1';
    if (!options.changeOrigin) options.changeOrigin = false;
    if (!options.ws) options.ws = false;

    if (!options.pathRewrite) options.pathRewrite = (path, req) => {

    
        if (isProxyRegEx.test(path)) {

            let purl = path.replace(isProxyRegEx, '/$1')
            console.log('isProxyRegEx pathRewrite= ' + purl);
            return purl;
        } else {
            return determinePath(path, req)
        }
 
    };

    if (!options.onProxyRes) options.onProxyRes = (proxyRes, req, res) => {
        var body = "";

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

    var filter = (pathname, req) => {
        var pathtest = isProxyPath.test(pathname, req);
        var methodtest = isUploadMethod.test(pathname, req);

        console.log("isProxyPath, '" + pathname + "' " + pathtest);
        console.log("isUploadMethod, '" + req.method + "' " + methodtest);

        return methodtest || pathtest;
    }

    /**
     * Create the proxy middleware, so it can be used in a server.
     */
    return hpm(filter, options);
}


app.use(proxyBuilder());

app.use('/fmgr', require('./routes/fmgr').default)

// api router
// app.use('/api', api({ config, db }));
app.get('/', function (req, res) {
    res.send('hello world');
});

const server = app.listen(process.env.PORT || config.port, () => {
    console.log(`Listening on: http://${server.address().address}:${server.address().port}`);
});

export default app;
// module.exports = app;

// function getCoffee() {
//     return new Promise(resolve => {
//       setTimeout(() => resolve('☕'), 2000); // it takes 2 seconds to make coffee
//     });
//   }

var purl = '/error';
function getForm() {
    var multiparty = require('multiparty');

    return new multiparty.Form({
        encoding: "utf8",
        maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
        autoFields: true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
        autoFiles: false          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
    });
}

function inpectForm(req) {

    return new Promise(resolve => {
        var form = getForm();
        let purl = 'non'

        form.parse(req, (err, fields, files) => {
            Object.keys(fields).forEach(function (name) {
                uplargs[name] = encodeURIComponent(fields[name][0]);
                console.log('got field named: ' + name);
                console.log('got field value: ' + fields[name][0]);
            });

            //            Object.keys(files).forEach(function(fileFieldKey) {
            //                var file = files[fileFieldKey][0];
            //                console.log('got file fileFieldKey ' + fileFieldKey);
            //                console.log('got file fileFieldName ' + file.fieldName);
            //                console.log('got file originalFilename ' + file.originalFilename);
            //                console.log('got file path ' + file.path);
            //                console.log('got file file.headers ' + JSON.stringify(file.headers));
            //                console.log('got file file.size ' + file.size);
            //            });
            //   Uri: /upload//editor%40org.com/imgs/brand
            purl = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`;

            console.log('Upload completed!');
            console.log(`purl: ${purl}`);
            //          res.setHeader('text/plain');
            //          res.end('Received ' + files.length + ' files');
        });
        return resolve(purl);

    });
}


function determinePath(path, req) {
    let purl = '/error'
    console.log(`purl: ${purl}`);

    return inpectForm(req);
}