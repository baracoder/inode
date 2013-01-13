var flow = require('jar-flow');
var fs = require('fs');

var File = require('./file');
var jRespond = require('./utils').jRespond;


var Controller = {};
module.exports = Controller;

Controller.get = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
Controller.add = function(req,res) {
    flow.exec(function() {
        // make sure a file was uploaded
        if(typeof req.files === 'undefined' || typeof req.files.file === 'undefined') {
                return this(new Error('No file received'));
        }
        return File.add(req.files.file.path, this);
    }, function(err,data) {
        // file moved, we are done, make response
        // remove tempirary file independend of error
        if(!err) {
            data.msg='file saved';
        }
        fs.unlinkSync(req.files.file.path);
        return jRespond(err,res,data);
    });
};

Controller.update = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
Controller.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
    // TODO del datei
};


