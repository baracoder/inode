var elastical = require('elastical');
var flow = require('jar-flow');

var File = require('./file');
var config = require('../config');

var ec = new elastical.Client();

var Document = {};
module.exports = Document;


var indexName = 'documents-'+config.indexVersion;

Document.find = function(str,options,callback) {
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
    queryOptions.index = indexName;
    if(options.size) queryOptions.size = options.size;
    if(options.from) queryOptions.from = options.from;
    if(options.published) queryOptions.filter = {
        term: { published:true}
    };

    console.log("Query: %j",queryOptions);

    ec.search(queryOptions, function(err,hits,results) {
        if(err) {
            console.error(err);
            return callback(err);
        }
        console.log(results);
        return callback(undefined,results);
    });
};

Document.findByFile = function(fileId,callback) {
    // check if file is already used
    ec.search({
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
        index: indexName
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

Document.checkFileUsed = function(fileId, callback) {
    flow.exec(function() {
        Document.findByFile(fileId,this);
    }, function(err,res) {
        if(err) return callback(err);
        if(res.total>0) return callback(new Error('File '+fileId + ' already used'));
        return callback(undefined, res);
    });
};

Document.get = function(id,callback) {
    return ec.get(indexName,id,callback);
};

Document.update = function(id,doc,callback) {
    if(typeof id === 'undefined') return callback(new Error('No id specified'));

    doc.lastChanged = new Date().toISOString();
    doc.lastIndexed = new Date().toISOString();
    ec.index(indexName,'document',doc,{id:id},callback);

};

Document.add = function(description,fileIds,tags,date,callback) {
    flow.exec(function() {
        this.tags = tags;
        this.files = [];

        // check if files exist first
        for(var i in fileIds) {
            if(!File.existsSync(fileIds[i])) {
                console.log('fileExists: '+fileIds[i]);
                return this(new Error('file does not exist: '+fileIds[i]));
            }
        }

        // check if files already used, get/create tags
        for(var i in fileIds) Document.checkFileUsed(fileIds[i], this.MULTI());

    },function(results) {
        // check any errors
        if(!(results instanceof Array)) return this(results);
        for(var i in results) {
            if(typeof results[i]['0'] !== 'undefined') {
                return this(results[i]['0']);
            }
        }

        for(var i in fileIds) {
            File.getMimeForId(fileIds[i], (function(files,fileId,callback) {
                return function(err,mime) {
                    if(err) return callback(err);
                    files.push({
                        id:fileId,
                        mime:mime,
                        missing:false,
                        size: fs.stats(File.getPathById(fileId)).size
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
        ec.index(indexName,'document',{
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

