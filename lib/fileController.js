var fs = require('fs');
var Q = require('q');


var jRespond = require('./utils').jRespond;


var Controller = function (file, document) {
    this.file = file;
    this.document = document;
};

Controller.prototype.get = function(req,res) {
    var controller = this;
    var fileId = req.params.id;

    this.document.findByFile(fileId).then(function(doc) {
        if (!req.session.user || !req.session.user.login) {
            throw new Error('no login');
        }
        if (req.session.user.admin) {
            return;
        }
        if (!doc.published) {
            throw new Error('not published');
        }
    }).then(function () {
        res.sendfile(controller.file.getPathById(fileId),function(err){
            if(err) {
                return console.error(err);
            }
            return console.log('download complete: '+fileId);
        });
    }, function(err) {
        console.log(err.message);
        res.send(403, 'Permission denied');
    }).done();
};

Controller.prototype.add = function(req,res) {
    var controller = this;

    return Q.fcall(function() {
        // make sure a file was uploaded
        if(typeof req.files === 'undefined' || typeof req.files.file === 'undefined') {
                throw new Error('No file received');
        }
        return controller.file.add(req.files.file.path);
    }).then(function(data) {
        console.log('data:'+data);
        // file moved, we are done, make response
        // remove tempirary file independend of error
        data.msg='file saved';
        fs.unlinkSync(req.files.file.path);
        jRespond(null,res,data);
    }, function(err) {
        jRespond(err,res);
    }).done();
};

Controller.prototype.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
    // TODO del datei
};


module.exports = Controller;
