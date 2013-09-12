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


// route documents
var documentController = new DocumentController(document);
app.get('/document/_search/:q', documentController.find.bind(documentController));
app.get('/document/:id', documentController.get.bind(documentController));
app.post('/document', documentController.add.bind(documentController));
app.put('/document/:id', documentController.update.bind(documentController));
app.delete('/document/:id', documentController.delete.bind(documentController));

// route files
var fileController = new FileController(file);
app.get('/file/:id', fileController.get.bind(fileController));
app.post('/file', fileController.add.bind(fileController));
app.delete('/file/:id', fileController.delete.bind(fileController));

// route users
var userController = new UserController(user, program.bypassAuth);
app.post('/user/login', userController.login.bind(userController));
app.post('/user/logout', userController.logout.bind(userController));
app.get('/user/status', userController.status.bind(userController));



if (!program.noHttp) {
    app.listen(program.port);
    console.log('Listening on port '+program.port+'...');
}


