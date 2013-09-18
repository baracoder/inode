var fs = require('fs');
var Q = require('q');


var Document = function (elasticClient, file) {
    this.INDEX_VERSION = 1;

    this.elasticClient = elasticClient;
    this.file = file;
    this.indexName = 'documents-'+this.INDEX_VERSION;
    // TODO index prüfen ggf migrieren
    // TODO index anlegen
    this.createIndex();
};


Document.prototype.createIndex = function () {
    var document = this;

    console.log('creating/updating document index...');

    return Q.all([
            Q.ninvoke(document.elasticClient, 'createIndex', document.indexName),
            Q.ninvoke(document.elasticClient, 'createIndex', 'queries')
    ]).then(function(results) {
        // create or update indicies
        console.log('created:');
        console.log(results);

        // document mapping
        var makeDocIndex = Q.ninvoke(document.elasticClient, 'putMapping', document.indexName,'document',{
            document: {
                properties: {
                    description: {
                        type:'string',
                        term_vector:"with_positions_offsets",
                        store:'yes'
                    },
                    tags: {
                        type:'string',
                        index_name:'tag',
                        store:'yes'
                    },
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
                                index:'not_analyzed'
                            },
                            size: { type: 'integer'}
                        }
                    },
                    published: {type:'boolean'},
                    date: {type:'date'},
                    lastChecked: {type:'date'},
                    lastChanged: {type:'date'},
                    text: { 
                        type:'string',
                        term_vector:"with_positions_offsets",
                        store:'yes'
                    }
                }
            }
        });

        // queries mapping
        var mkQueriesIndex = Q.ninvoke(document.elasticClient,'putMapping', 'queries','docsearch',{
            docsearch: {
                properties: {
                    query: { type:'string'},
                    count: { type:'long'}
                }
            }
        });
        return Q.all([makeDocIndex, mkQueriesIndex]);
    }).then(function(results) {
        console.log('updated:');
        console.log(results);

    }, function(err) {
        console.log(JSON.stringify(err,4))
        if(err.type == 'IndexAlreadyExistsException') {
            console.log('index up to date');
        } else {
            console.log('creatingIndex:'+err);
        }
    });
};

Document.prototype.find = function(str,options) {
    var queryOptions = {};
    queryOptions.facets = {
        "tag" : {
            "terms" : {
                "field" : "tag",
                "size" : 20,
                "order" : "count"
            }
        }
    };
    queryOptions.query = {
        "query_string" : {
            "query" : str
        }
    };
    queryOptions.highlight = {
        "fields" : {
            "text" : {}
        }
    };
    // add options, if availible
    queryOptions.index = this.indexName;
    if(options.size) queryOptions.size = options.size;
    if(options.from) queryOptions.from = options.from;
    if(options.published) queryOptions.filter = {
        term: { published:true}
    };

    console.log("Query: %j",queryOptions);
    return Q.ninvoke(this.elasticClient, 'search', queryOptions);
};

Document.prototype.findByFile = function(fileId,callback) {
    // check if file is already used
    return Q.ninvoke(this.elasticClient, 'search', {
        "query": {
            "nested" : {
                "path" : "files",
                "score_mode" : "avg",
                "query" : {
                    "bool" : {
                        "must" : [
                            {
                                "term" : {"files.id" : fileId}
                            }
                        ]
                    }
                }
            }
        },
        index: this.indexName
    });
};

Document.prototype.checkFileUsed = function(fileId, callback) {
    return this.findByFile(fileId).then(function(res) {
        return Q.fcall(function() {
            return res.total>0;
        });
    });
};

Document.prototype.get = function(id) {
    return this.elasticClient.get(this.indexName,id,callback);
};

Document.prototype.update = function(id,doc) {
    if(typeof id === 'undefined') throw new Error('No id specified');

    doc.lastChanged = new Date().toISOString();
    doc.lastIndexed = new Date().toISOString();
    return Q.ninvoke(this.elasticClient, 'index', this.indexName, 'document', doc, {id:id});
};

Document.prototype.add = function(description,fileIds,tags,date,callback) {
    var document = this;

    return Q.fcall(function() {
        var p = [];
        fileIds.forEach( function(fileId) {
            // check if files exist
            if(!document.file.existsSync(fileId)) {
                throw new Error('file does not exist: '+fileId);
            }
            p.push(document.checkFileUsed(fileId));
        });
        return Q.all(p);
    }).then(function(results) {
        var p = [];
        fileIds.forEach(function(fileId) {
            p.push(document.file.getMimeForId(fileId).then(function(mime) {
                return {
                    id: fileId,
                    mime: mime,
                    missing: false,
                    size: fs.statSync(document.file.getPathById(fileId)).size
                };
            }));
        });
        return Q.all(p);
    }).then(function(files) {
        console.log('files:');
        console.log(files);
        // create document
        return Q.ninvoke(document.elasticClient, 'index', document.indexName, 'document',{
            description:description,
            tags: tags,
            files: files,
            published: false,
            date: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            lastChanged: new Date().toISOString(),
            text:''
        });
    });
};

module.exports = Document;
