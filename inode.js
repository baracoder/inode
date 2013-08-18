var express = require('express');
var elastical = require('elastical');
var flow = require('jar-flow');

var config = require('./config');
var Document = require('./lib/document');
var DocumentController = require('./lib/documentController');
var FileController = require('./lib/fileController');
var UserController = require('./lib/userController');


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

var document = new Document(ec);

// route documents
var documentController = new DocumentController(document);
var apply = function(obj, fkt) {
    return function() {
        return fkt.apply(obj,arguments);
    };
};
app.get('/document/_search/:q', apply(documentController,documentController.find));
app.get('/document/:id', apply(documentController,documentController.get));
app.post('/document', apply(documentController, documentController.add));
app.put('/document/:id', apply(documentController, documentController.update));
app.delete('/document/:id', apply(documentController, documentController.delete));

// route files
app.get('/file/:id', FileController.get);
app.post('/file', FileController.add);
app.delete('/file/:id', FileController.delete);

// route users
app.post('/user/login',UserController.login);
app.post('/user/logout',UserController.logout);
app.get('/user/status',UserController.status);



    app.listen(config.port);
    console.log('Listening on port '+config.port+'...');


