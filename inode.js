var express = require('express');
var document = require('./lib/document');
var file = require('./lib/file');

var app = express();

app.configure(function () {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

// route documents
app.get('/document', document.find);
app.get('/document/:id', document.get);
app.post('/document', document.add);
app.put('/document/:id', document.update);
app.delete('/document/:id', document.delete);

app.get('/file', file.find);
app.get('/file/:id', file.get);
app.post('/file', file.add);
app.put('/file/:id', file.update);
app.delete('/file/:id', file.delete);

app.listen(3000);

console.log('Listening on port 3000...');
