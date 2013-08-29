var express = require('express');
var elastical = require('elastical');
var flow = require('jar-flow');
var program = require('commander');


var Document = require('./lib/document');
var File = require('./lib/file');
var User = require('./lib/user');
var DocumentController = require('./lib/documentController');
var FileController = require('./lib/fileController');
var UserController = require('./lib/userController');


program
    .option('-p, --port <n>', 'HTTP port', parseInt, 3000)
    .option('-b, --bypass-auth', 'Bypass authentication')
    .option('-m, --min-tags', 'Minimum required tags', parseInt, 3)
    .option('-s, --storage <PATH>', 'Path to file storage', './storage')
    .option('-n, --no-http', 'Do not listen for HTTP connections')
    .parse(process.argv);


var ec = new elastical.Client();
var app = express();

app.configure(function () {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    //app.use(express.limit('20mb')); // TODO absprechen
    app.use('/static', express.static(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(express.cookieSession({
        secret:''+Math.random()+new Date(),
        key:'inode'
        }));
});

var file = new File(program.storage);
var document = new Document(ec, file);
var user = new User();


var apply = function(obj, fkt) {
    return function() {
        return fkt.apply(obj,arguments);
    };
};

// route documents
var documentController = new DocumentController(document);
app.get('/document/_search/:q', apply(documentController,documentController.find));
app.get('/document/:id', apply(documentController,documentController.get));
app.post('/document', apply(documentController, documentController.add));
app.put('/document/:id', apply(documentController, documentController.update));
app.delete('/document/:id', apply(documentController, documentController.delete));

// route files
var fileController = new FileController(file);
app.get('/file/:id', apply(fileController, fileController.get));
app.post('/file', apply(fileController, fileController.add));
app.delete('/file/:id', apply(fileController, fileController.delete));

// route users
var userController = new UserController(user, program.bypassAuth);
app.post('/user/login', apply(userController, userController.login));
app.post('/user/logout', apply(userController, userController.logout));
app.get('/user/status', apply(userController, userController.status));



if (!program.noHttp) {
    app.listen(program.port);
    console.log('Listening on port '+program.port+'...');
}


