var fs = require('fs');
var Q = require('q');


var jRespond = require('./utils').jRespond;


var Controller = function (file) {
    this.file = file;
};

Controller.prototype.get = function(req,res) {
    var fileId = req.params.id;

    // TODO check if file published or user is admin
    if(req.session.user && req.session.user.login) {
        res.sendfile(this.file.getPathById(fileId),function(err){
            if(err) return console.error(err);
            return console.log('download complete: '+fileId);
        });
    } else {
      res.send(403, 'Sorry! you cant see that.');
    }
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
