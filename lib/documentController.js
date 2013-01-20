var jRespond = require('./utils').jRespond;
var flow = require('jar-flow');
var Document = require('./document');
var Extractor = require('./extractor');

var Controller = {};
module.exports = Controller;

Controller.find = function(req,res) {
    if(!req.session.user || !req.session.user.login) {
        return jRespond(new Error('login required'),res);
    }

    var options = {
        'from':parseInt(req.query.from),
        'size':parseInt(req.query.size)
        // TODO publicated false, bzw admin check
    };
    Document.find(req.params.q,options,function(err,results) {
        return jRespond(err,res,results);
    });
};
Controller.get = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
Controller.add = function(req,res) {
    console.log(req.body);
    // check if all parameters there
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
        var sha1 = files[i].split('.')[0];
        if(sha1.length !== 40) return jRespond(new Error("malformed files string"),res);
    }

    // TODO parse date
    var date = "";

    Document.add(req.body.description,files,tags,date,function(err,doc) {
        // respond with id/error
        if(!err) {
            console.log(doc);
            var data = {
                msg: 'document created',
                id: doc._id
            };
            Extractor.add(doc._id);
        }
        return jRespond(err,res,data);
    });


};
Controller.update = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
Controller.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};

