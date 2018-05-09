var express = require('express');
var router = express.Router();


var orgId = '810';
var orgName = 'org.com';
var courseName = 'course_101';

router.get('/', function(req, res, next) {
  res.render('upload_form', {
    title: 'Upload Form' ,
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
    }],
    destDir : 'asdfghjk'
  });
});

module.exports = router;
