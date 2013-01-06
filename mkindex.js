var elastical = require('elastical');
var flow = require('jar-flow');

var ec = new elastical.Client();


flow.exec(function() {
// create indicies if not existing
    ec.createIndex('files',this.MULTI());
    ec.createIndex('documents',this.MULTI());
    ec.createIndex('tags',this.MULTI());
    ec.createIndex('queries',this.MULTI());
}, function(results) {
// create or update indicies
    console.log('created:');
    console.log(results);

    // file mapping
    ec.putMapping('files','file',{
        file: {
            properties: {
                text: { type:'string', index:'not_analyzed'},
                lastChecked: {type:'date'},
                missing: {type:'boolean'},
                mimeType: {type:'string', index:'not_analyzed'}
            }
        }
    },this.MULTI());

    // document mapping
    ec.putMapping('documents','document',{
        document: {
            properties: {
                description: { type:'string'},
                tags: {type:'string',index_name:'tag'},
                files: {type:'string',index_name:'file'},
                published: {type:'boolean'},
                created: {type:'date'},
                date: {type:'date'},
                lastIndexed: {type:'date'},
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
            }
        }
    },this.MULTI());
},function(results) {
    console.log('updated:');
    console.log(results);
});
