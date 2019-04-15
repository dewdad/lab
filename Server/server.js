var fs = require("fs");
var static = require('node-static');

var file = new static.Server('../');

const options = {
  key: fs.readFileSync('./privatekey.pem'),
  cert: fs.readFileSync('./certification.pem')
};

require('https').createServer(options, function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response, function (e, res) {
          console.error(e, res);
          if (e && (e.status === 404)) { // If the file wasn't found
            response.writeHead(e.status, e.headers);
            response.write('404! file not found');
            response.end();
          }
      });
    }).resume();
}).listen(8888);

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
      file.serve(request, response, function (e, res) {
        console.error(e, res);
        if (e && (e.status === 404)) { // If the file wasn't found
          response.writeHead(e.status, e.headers);
          response.write('404! file not found');
          response.end();
        }
    });
  }).resume();
}).listen(8080);