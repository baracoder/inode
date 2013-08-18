var jRespond = require('./utils').jRespond;
var flow = require('jar-flow');
var Extractor = require('./extractor');
var config = require('../config');

var Controller = function (document,minTags) {
    this.document = document;
    this.minTags = minTags;
};


Controller.prototype.find = function(req,res) {
    var controller = this;

    if(!req.session.user || !req.session.user.login) {
        return jRespond(new Error('login required'),res);
    }

    var options = {
        'from':parseInt(req.query.from),
        'size':parseInt(req.query.size)
        // TODO publicated false, bzw admin check
    };
    controller.document.find(req.params.q,options,function(err,results) {
        return jRespond(err,res,results);
    });
};

Controller.prototype.get = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};

Controller.prototype.add = function(req,res) {
    var controller = this;
    console.log(req.body);
    // check if all parameters there
    if(typeof req.body.files === 'undefined') {
        return jRespond(new Error("refusing to create empty document"),res);
    }

    if(typeof req.body.tags === 'undefined') {
        return jRespond(new Error("refusing to create untagged document"),res);
    }

    // parse tags
    var tags = req.body.tags;

    if(tags.length < config.minTags) {
        return jRespond(new Error("more tags required"),res);
    }

    // parse files
    var files = req.body.files;
    for(var i=files.length-1;i>=0;i--) {
        var sha1 = files[i].split('.')[0];
        if(sha1.length !== 40) return jRespond(new Error("malformed files string"),res);
    }

    // TODO parse date
    var date = "";

    controller.document.add(req.body.description,files,tags,date,function(err,doc) {
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

Controller.prototype.update = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};

Controller.prototype.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};

module.exports = Controller;

