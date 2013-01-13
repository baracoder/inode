var express = require('express');
var DocumentController = require('./lib/documentController');
var FileController = require('./lib/fileController');
var elastical = require('elastical');
var flow = require('jar-flow');


var ec = new elastical.Client();
var app = express();

app.configure(function () {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    //app.use(express.limit('20mb')); // TODO absprechen
});

// route documents
app.get('/document/_search/:q', DocumentController.find);
app.get('/document/:id', DocumentController.get);
app.post('/document', DocumentController.add);
app.put('/document/:id', DocumentController.update);
app.delete('/document/:id', DocumentController.delete);

app.get('/file/:sha1', FileController.get);
app.post('/file', FileController.add);
app.put('/file/:id', FileController.update);
app.delete('/file/:id', FileController.delete);

var port = 3000;




flow.exec(function() {
// create indicies if not existing
    ec.createIndex('documents',this.MULTI());
    ec.createIndex('tags',this.MULTI());
    ec.createIndex('queries',this.MULTI());
}, function(results) {
// create or update indicies
    console.log('created:');
    console.log(results);

    // document mapping
    ec.putMapping('documents','document',{
        document: {
            properties: {
                description: { type:'string'},
                tags: {type:'string',index_name:'tag'},
                files: {
                    type:'nested',
                    properties: {
                        id: { 
                            type:'string',
                            index:'not_analyzed'
                        },
                        missing: { type: 'boolean'},
                        mime: {
                            type: 'string',
                            qGYsUj_1Ri6j3hr0QD9_yQ
                        }
                    }
                },
                published: {type:'boolean'},
                created: {type:'date'},
                date: {type:'date'},
                lastIndexed: {type:'date'},
                lastChecked: {type:'date'},
                lastChanged: {type:'date'},
            }
        }
    },this.MULTI());

    // tag mapping
    ec.putMapping('tags','tag',{
        tag: {
            properties: {
                name: { type:'string'},
                words: {type:'string',index_name:'tag'},
            }
        }
    },this.MULTI());

    // tag mapping
    ec.putMapping('queries','docsearch',{
        docsearch: {
            properties: {
                query: { type:'string'},
                count: { type:'long'}
            }
        }
    },this.MULTI());
},function(results) {
    console.log('updated:');
    console.log(results);

    app.listen(port);
    console.log('Listening on port '+port+'...');
});

