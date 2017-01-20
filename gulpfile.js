﻿var gulp = require('gulp'),
    connect = require('gulp-connect'),
    jsonfile = require('jsonfile'),
    Busboy = require('busboy'),
    path = require('path'),
    os = require('os'),
    fs = require('fs');

gulp.task('connect', function () {
    connect.server({
        root: './',
        port: 8000,
        middleware: function (connect, opt) {
            return [
              function middleware(req, res, next) {
                  // urls to respond to
                  let urls = {
                      '/response.json': __dirname + '/chapter8/response.json',
                      '/signin': __dirname + '/chapter8/loginresponse.json',
                      '/get_request': __dirname + '/chapter8/getresponse.json'
                  };
                  let match = false;
                  let destination = __dirname + '/uploadedFiles';

                  if (!fs.existsSync(destination)) {
                      // create upload directory if doesn't exist
                      fs.mkdirSync(destination, 0777);
                  }

                  function respond(jsonFileUrl) {
                      // set json response header
                      res.setHeader('Content-type', 'application/json');
                      jsonfile.readFile(jsonFileUrl, function (err, obj) {
                          if (err) { console.log(err); }

                          res.writeHead(200, { 'Connection': 'close' });

                          // stringify json from .json file
                          res.end(JSON.stringify(obj));
                      });
                  }

                  if (req.url === '/upload') {
                      let busboy = new Busboy({ headers: req.headers });

                      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                          let destinationFile = path.join(destination, '/', filename);

                          if (!fs.existsSync(destinationFile)) {
                              // create uploaded file in filesystem if it doesn't exist
                              file.pipe(fs.createWriteStream(destinationFile));
                          } else {
                              // return response if file already exists
                              match = true;
                              respond(__dirname + '/chapter8/uploadresponse.json');
                          }
                      });

                      busboy.on('finish', function () {
                          match = true;
                          respond(__dirname + '/chapter8/uploadresponse.json');
                      });

                      return req.pipe(busboy);
                  }

                  Object.keys(urls).forEach(function (url) {
                      if (req.url === url) {
                          match = true;
                          respond(urls[url]);
                      }
                  });

                  if (!match) {
                      next();
                  }
              }
            ];
        }
    });
});

gulp.task('setup', function () {
    // create test file for uploading
    require('child_process').exec('fsutil file createnew uploadFile 1073741824', function (err) {
        if (err) return console.log(err);
        console.log('Test upload file created');
    });
});
