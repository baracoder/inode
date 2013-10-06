var express = require('express');
var elastical = require('elastical');
var program = require('commander');
var Q = require('q');


var Document = require('./lib/document');
var File = require('./lib/file');
var User = require('./lib/user');
var TaskQueue = require('./lib/taskQueue');
var DocumentController = require('./lib/documentController');
var FileController = require('./lib/fileController');
var UserController = require('./lib/userController');


program
    .option('-p, --port <n>', 'HTTP port', parseInt, 3000)
    .option('-b, --bypass-auth', 'Bypass authentication')
    .option('-m, --min-tags', 'Minimum required tags', parseInt, 3)
    .option('-M, --maxTasks', 'Maximum background tasks running at once', parseInt, 3)
    .option('-N, --no-tasks', 'Do not run tasks')
    .option('-s, --storage <PATH>', 'Path to file storage', './storage')
    .option('-n, --no-http', 'Do not listen for HTTP connections')
    .option('-d, --debug', 'Enabe debug')
    .parse(process.argv);

Q.longStackSupport = program.debug;

var ec = new elastical.Client();
var app = express();

app.configure(function () {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    //app.use(express.limit('20mb')); // TODO absprechen
    app.use('/lernhilfen/static', express.static(__dirname + '/static'));
    app.use(express.cookieParser());
    app.use(express.cookieSession({
        secret:Math.random()+new Date(),
        key:'inode'
        }));
    app.use('/lernhilfen', app.router);
});

var file = new File(program.storage);
var document = new Document(ec, file);
var user = new User();

var taskQueue = new TaskQueue(ec, file, document, { 
    maxTasks: program.maxTasks,
    start: program.tasks
});
document.event.on('created', function(doc) {
    taskQueue.push('extract', doc._id);
});

// if index is requested, redirect to web-ui
app.get('/', function (req, res) {
    res.redirect('./static/');
});

// route documents
var documentController = new DocumentController(document);
app.get('/document/_search/:q', documentController.find.bind(documentController));
app.get('/document/:id', documentController.get.bind(documentController));
app.post('/document', documentController.add.bind(documentController));
app.put('/document/:id', documentController.update.bind(documentController));
app.delete('/document/:id', documentController.delete.bind(documentController));

// route files
var fileController = new FileController(file);
app.get('/file/:id/:filename', fileController.get.bind(fileController));
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


