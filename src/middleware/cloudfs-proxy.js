

// If button value contains 'upload' || 'replace'

//export default(opt) => {
//    return async require('http-proxy-middleware')(opt);
//}


// return (options) => {

//     function parseFormTOBuild(path, req) {

//         var bucketId ='2ab327a44f788e635ef20613';
//         var orgAuthor = encodeURIComponent('editor@org.com');

//         var orgId = '810';
//         var orgName = 'org.com';
//         var destDir = `${orgId}${bSlash}${orgName}${bSlash}course1`;
//         return `/upload/${bucketId}/${orgAuthor}/${destDir}`
//     }

// 	if (!options.target) options.target = 'http://localhost:8080/cloudfs/api/v1';
// 	if (!options.changeOrigin) options.changeOrigin = false;
// 	if (!options.ws) options.ws = false;

// 	if (!options.pathRewrite) options.pathRewrite = (path, req) => {
//         var purl = '/error';

//         if (isProxyPath.test(ppath) ) {
//             console.log('pathRewrite= ' + path.replace(isProxyPath, '/$1'));

//             purl = path.replace(isProxyPath, '/$1')
//         } else {
//             console.log("undeclared form")
//             purl = parseFormTOBuild(path, req);
//         }

//         console.log(`purl: ${purl}`);
//         return purl;
//     };

// 	if (!options.onProxyRes) options.onProxyRes = (proxyRes, req, res) => {
//         var body = "";

//         proxyRes.on('data', function(data) {
//           data = data.toString('utf-8');
//           body += data;
//         })

//         proxyRes.on('end', function(data) {
//           try{
//             if (proxyRes.headers['content-type'].startsWith('application/json')) {
//               data = JSON.parse( body);
//               console.log("data:", data[0].downloadUrl);
//             } else {
//               data = body;
//             }
//           } catch (err) {}
//         })
//     };


//     var filter = (pathname, req) =>  (isUploadMethod.test(req.method) && isUploadButton.test(req.body.submit))
//         || isProxyPath.test(pathname)

//     /**
//      * Create the proxy middleware, so it can be used in a server.
//      */
//     return proxy(filter, options)
// };




    // This is proxyBaseUrl
//    app.use('/rfs', proxyMiddleware())


// To let thru hardcoded requests
// Ex:
// http://localhost:3001/rfs/file/b2public/810/org.com/course1/logoPaths/208x32.png
// OR :   ( .../cloudfs/api/v1/upload/2ab327a44f788e635ef20613/editor@org.com/org^mob )
// http://localhost:3001/rfs/upload/{bucketId}/{authorName}/{orgName}^{nestedDir}
// http://localhost:3001/rfs/list

