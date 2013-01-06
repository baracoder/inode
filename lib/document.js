var elastical = require('elastical');
var flow = require('jar-flow');

var jRespond = require('./utils').jRespond;


var ec = new elastical.Client();


exports.find = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.get = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.add = function(req,res) {
    console.log(req.body);
    // 1. check if all parameters there
    if(typeof req.body.files === 'undefined') {
        return jRespond(new Error("refusing to create empty document"),res);
    }

    if(typeof req.body.tags === 'undefined') {
        return jRespond(new Error("refusing to create untagged document"),res);
    }

    // TODO anständigen parser schreiben
    // parse tags
    var tags = req.body.tags.split(',');
    for(var i=tags.length-1;i>=0;i--) {
        if(tags[i].length < 2) tags.splice(i,1);
    }

    // TODO config
    if(tags.length < 3) {
        return jRespond(new Error("more tags required"),res);
    }

    // parse files
    var files = req.body.files.split(',');
    if(files[files.length-1]==='') files.pop();
    for(var i=files.length-1;i>=0;i--) {
        if(files[i].length !== 40) return jRespond(new Error("malformed files string"),res);
    }

    flow.exec(function() {
        // 2a. check if all files availible
        for(var i in files) {
            (function(file_id,callback) {
                ec.get('files',file_id, function(err,doc,eRes) {
                    console.log('searched files');
                    if(err) return callback(err);
                    // check if file is already used
                    ec.search({
                        query: {
                            term: {files: file_id }
                        },
                        index: 'documents'
                    }, function(err,results,eRes) {
                        if(err) {
                            console.error(err);
                            return callback(err);
                        }
                        console.log('searched documents');
                        console.log(results);
                        if(results.total>0) {
                            return callback(new Error('File already used: '+file_id));
                        }
                        return callback(undefined,file_id);
                    });
                });
            }) (files[i], this.MULTI());
        }

        // 2b. check if tags exist, create if not
        this.tags = [];
        var _flow = this;
        for(var i in tags) {
            (function(tag,callback) { // define new scope to preserve the closure
                ec.get('tags',tag, function(err,doc,eRes) {
                    console.log('searched tag: '+tag);
                    if(err && err.message !== 'HTTP 404') return callback(err);
                    if(err) {
                        // tag does not exist, create it
                        ec.index('tags','tag', {
                            name: tag,
                            words: [tag]
                        },{
                            id: tag
                        },function(err,eRes) {
                            if(err) callback(err);
                            _flow.tags.push(tag);
                            return callback();
                        });
                    } else {
                        // tag exists, add all word to taglist
                        console.log('tag exists: '+tag);
                        console.log(doc);
                        _flow.tags = _flow.tags.concat(doc.words);
                        return callback();
                    }
                });
            }) (tags[i],this.MULTI());
        }
    },function(results) {
        console.log('got results');
        console.log(results);
        console.log(this.tags);

        for(var i in results) {
            if(typeof results[i]['0'] !== 'undefined') return this(results[i]['0']);
        }

        // 3. create document
        ec.index('documents','document',{
            description:req.body.description || '',
            tags: this.tags,
            files: files,
            published: false,
            created: "2013-01-01",
            date: "2013-01-01", // TODO parameter parsen
            lastIndexed: "2013-01-01",
            lastChanged: "2013-01-01"
        },this);
    },function(err,doc){
        // 4. respond with id/error
        if(!err) {
            console.log(doc);
            var data = {
                msg: 'document created',
                id: doc._id
            };
        }
        return jRespond(err,res,data);
    });



};
exports.update = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
