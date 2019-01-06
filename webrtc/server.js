var fs = require("fs");
var static = require('node-static');

var file = new static.Server('./public');

const options = {
  key: fs.readFileSync('D:/privatekey.pem'),
  cert: fs.readFileSync('D:/certification.pem')
};

require('https').createServer(options, function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(8080);