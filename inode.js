var express = require('express');
var document = require('./lib/document');
var file = require('./lib/file');

var app = express();

app.configure(function () {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.limit('20mb')); // TODO absprechen
});

// route documents
app.get('/document/_search/:q', document.find);
app.get('/document/:id', document.get);
app.post('/document', document.add);
app.put('/document/:id', document.update);
app.delete('/document/:id', document.delete);

app.get('/file/_search/:q', file.find);
app.get('/file/:sha1', file.get);
app.post('/file', file.add);
app.put('/file/:id', file.update);
app.delete('/file/:id', file.delete);

var port = 3000;
app.listen(port);

console.log('Listening on port '+port+'...');
