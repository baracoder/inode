var fs = require('fs');
var flow = require('jar-flow');


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

    flow.exec(function() {
    // create indicies if not existing
        document.elasticClient.createIndex(document.indexName,this.MULTI());
        document.elasticClient.createIndex('queries',this.MULTI());
    }, function(results) {
    // create or update indicies
        console.log('created:');
        console.log(results);

        // document mapping
        document.elasticClient.putMapping(document.indexName,'document',{
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
        },this.MULTI());

        // queries mapping
        document.elasticClient.putMapping('queries','docsearch',{
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

    });
};

Document.prototype.find = function(str,options,callback) {
    var document = this;

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
    queryOptions.index = document.indexName;
    if(options.size) queryOptions.size = options.size;
    if(options.from) queryOptions.from = options.from;
    if(options.published) queryOptions.filter = {
        term: { published:true}
    };

    console.log("Query: %j",queryOptions);

    document.elasticClient.search(queryOptions, function(err,hits,results) {
        if(err) {
            console.error(err);
            return callback(err);
        }
        console.log(results);
        return callback(undefined,results);
    });
};

Document.prototype.findByFile = function(fileId,callback) {
    var document = this;

    // check if file is already used
    document.elasticClient.search({
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
        index: document.indexName
    }, function(err,results,eRes) {
        if(err) {
            console.error(err);
            return callback(err);
        }
        console.log(results);
        if(results.total>0) {
            return callback(new Error('File already used: '+fileId));
        }
        return callback(undefined,results);
    });
};

Document.prototype.checkFileUsed = function(fileId, callback) {
    var document = this;
    flow.exec(function() {
        document.findByFile(fileId,this);
    }, function(err,res) {
        if(err) return callback(err);
        if(res.total>0) return callback(new Error('File '+fileId + ' already used'));
        return callback(undefined, res);
    });
};

Document.prototype.get = function(id,callback) {
    var document = this;

    return document.elasticClient.get(document.indexName,id,callback);
};

Document.prototype.update = function(id,doc,callback) {
    var document = this;

    if(typeof id === 'undefined') return callback(new Error('No id specified'));

    doc.lastChanged = new Date().toISOString();
    doc.lastIndexed = new Date().toISOString();
    document.elasticClient.index(document.indexName,'document',doc,{id:id},callback);

};

Document.prototype.add = function(description,fileIds,tags,date,callback) {
    var document = this;

    flow.exec(function() {
        this.tags = tags;
        this.files = [];

        // check if files exist first
        for(var i in fileIds) {
            if(!document.file.existsSync(fileIds[i])) {
                console.log('fileExists: '+fileIds[i]);
                return this(new Error('file does not exist: '+fileIds[i]));
            }
        }

        // check if files already used, get/create tags
        for(var i in fileIds) document.checkFileUsed(fileIds[i], this.MULTI());

    },function(results) {
        // check any errors
        if(!(results instanceof Array)) return this(results);
        for(var i in results) {
            if(typeof results[i]['0'] !== 'undefined') {
                return this(results[i]['0']);
            }
        }

        for(var i in fileIds) {
            document.file.getMimeForId(fileIds[i], (function(files,fileId,callback) {
                return function(err,mime) {
                    if(err) return callback(err);
                    files.push({
                        id:fileId,
                        mime:mime,
                        missing:false,
                        size: fs.statSync(document.file.getPathById(fileId)).size
                    });
                    callback(undefined,files);
                };
            }(this.files, fileIds[i], this.MULTI())));
        }
    },function(results) {
        // check any errors
        if(!(results instanceof Array)) return this(results);
        for(var i in results) {
            if(typeof results[i]['0'] !== 'undefined') {
                return this(results[i]['0']);
            }
        }

        // create document
        document.elasticClient.index(document.indexName,'document',{
            description:description,
            tags: this.tags,
            files: this.files,
            published: false,
            date: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            lastChanged: new Date().toISOString(),
            text:''
        },this);
    },function(err,doc,eRes){
        if(err) return callback(err);
        callback(err,doc);
    });
};

module.exports = Document;
