var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.engine('pug', require('pug').__express)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

const proxyBuilder = (options) => {

    const hpm = require('http-proxy-middleware');

    options = options || {};

    if (!options.fsroute) options.fsroute = '/cfs';

    const isUploadRegEx = new RegExp('(?:POST|PUT).*', 'i');
    const isProxyRegEx = new RegExp('^' + options.fsroute + '/*(.*)', 'i');

    const isUploadMethod = {
       test: (pathname, req) => {
       console.log("ctype: " + req.headers['content-type']);
         return isUploadRegEx.test(req.method) && req.headers['content-type'].startsWith('multipart/form-data') ;
       }
    }

    const isProxyPath = {
       test: (pathname, req) => {
           return isProxyRegEx.test(pathname);
       }
    }


    if (!options.target) options.target = 'http://localhost:8080/cloudfs/api/v1';
    if (!options.changeOrigin) options.changeOrigin = false;
    if (!options.ws) options.ws = false;

    if (!options.pathRewrite) options.pathRewrite = (path, req) => {
         var purl = '/error';

         if (isProxyRegEx.test(path) ) {

             purl = path.replace(isProxyRegEx, '/$1')
             console.log('isProxyRegEx pathRewrite= ' + purl);

         } else {
             console.log("undeclared form")
//             purl = parseFormTOBuild(path, req);


        var multiparty = require('multiparty');

        var formOpts = {
            encoding : "utf8",
            maxFilesSize: 1024 ^ 3,   // num bytes. default is Infinity.
            autoFields : true,        // Enables field events and disables part events for fields. This is automatically set to true if you add a field listener.
            autoFiles: true          // Enables file events and disables part events for files. This is automatically set to true if you add a file listener.
//            uploadDir
        };

        var form = new multiparty.Form(formOpts);

        var uplargs = {
            bucketId: '',
            destDir: '',
            author: encodeURIComponent('editor@org.com')
            };


        form.parse(req, function(err, fields, files) {
            Object.keys(fields).forEach(function(name) {
                uplargs[name] = encodeURIComponent(fields[name][0]);
                console.log('got field named: ' + name);
                console.log('got field value: ' + fields[name][0]);
            });

            Object.keys(files).forEach(function(fileFieldKey) {
                var file = files[fileFieldKey][0];

//                uplargs.destDir = fileFieldKey;

                console.log('got file fileFieldKey ' + fileFieldKey);
                console.log('got file fileFieldName ' + file.fieldName);
                console.log('got file originalFilename ' + file.originalFilename);
                console.log('got file path ' + file.path);
                console.log('got file file.headers ' + JSON.stringify(file.headers));
                console.log('got file file.size ' + file.size);
            });
//   Uri: /upload//editor%40org.com/imgs/brand

            console.log('Upload completed!');
            console.log('Uri: ' + `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`);
//          res.setHeader('text/plain');
//          res.end('Received ' + files.length + ' files');
        });


        purl = `/upload/${uplargs.bucketId}/${uplargs.author}/${uplargs.destDir}`

         }

         console.log(`purl: ${purl}`);
         return purl;
     };

    if (!options.onProxyRes) options.onProxyRes = (proxyRes, req, res) => {
         var body = "";

         proxyRes.on('data', function(data) {
           data = data.toString('utf-8');
           body += data;
         })

         proxyRes.on('end', function(data) {
           try{
             if (proxyRes.headers['content-type'].startsWith('application/json')) {
               data = JSON.parse( body);
               console.log("data:", data[0].downloadUrl);
             } else {
               data = body;
             }
           } catch (err) {}
         })
     };

     var filter = (pathname, req)  => {
        var pathtest = isProxyPath.test(pathname, req);
        var methodtest = isUploadMethod.test(pathname, req);

        console.log("isProxyPath, '" + pathname + "' " + pathtest) ;
        console.log("isUploadMethod, '" + req.method + "' " + methodtest) ;

        return methodtest || pathtest;
     }

     /**
      * Create the proxy middleware, so it can be used in a server.
      */
    return hpm(filter, options);
}


app.use(proxyBuilder());



// fmgr is a demo.
app.use('/fmgr', function(req, res, next) {
    res.render('upload_form', {
    title: 'Upload Form',
    buckets: [ {
             "accountId": "a374f8e3e263",
             "bucketId": "2ab327a44f788e635ef20613",
             "bucketInfo": {},
             "bucketName": "b2public",
             "bucketType": "allPublic",
             "corsRules": [],
             "lifecycleRules": [],
             "revision": 30
         },
         {
             "accountId": "a374f8e3e263",
             "bucketId": "fa73d7e42f083e836e020613",
             "bucketInfo": {},
             "bucketName": "rdnisn-zcloudfs-public",
             "bucketType": "allPrivate",
             "corsRules": [],
             "lifecycleRules": [],
             "revision": 3
        }]
    });
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
