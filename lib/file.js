var crypto = require('crypto');
var fs = require('fs');
var util = require('util');
var elastical = require('elastical');
var flow = require('jar-flow');
var mime = require('mime');

var jRespond = require('./utils').jRespond;

var ec = new elastical.Client();

// TODO settings
var storeDir = 'storage';


exports.find = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.get = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};

exports.add = function(req,res) {
    flow.exec(function() {
    // calc sha1sum of uploaded file
        // make sure a file was uploaded
        if(typeof req.files === 'undefined' || typeof req.files.file === 'undefined') {
                return this(new Error('No file received'));
        }

        this.data = {};

        var readStream = fs.ReadStream(req.files.file.path);
        var sha1 = crypto.createHash('sha1');

        var _flow = this;
        readStream.on('data', function(d) {
            sha1.update(d);
        });
        readStream.on('error', this);
        readStream.on('end', function() {
            _flow.data.id=sha1.digest('hex');
            return _flow();
        });
    }, function(err) {
    // sha1 calculated, try to get file by id
        if(err) return this(err);
        ec.get('files',this.data.id, this);
    }, function(err,doc,eRes) {
    // got db response
        console.log('got db answer');
        if(!err) return this(new Error('file exists'));
        if(err.message !== 'HTTP 404') return this(err);

        console.log(err.message);
        console.log(err.name);

        ec.index('files','file', {
            text: '', // TODO index text
            missing: false,
            size: req.files.file.size,
            mimieType: req.files.file.type
        }, { // options
            id: this.data.id
        }, this );
    }, function(err,eRes) {
    // indexed file
        if(err) return this(err);
        console.log('indexed');
        this.file = eRes;

        // create file name & foldername
        var extension = mime.extension(req.files.file.type);
        var filename = this.data.id+'.'+extension;
        var dirname = this.data.id.substr(0,3);
        var dirPath = storeDir+'/'+dirname;
        var filePath = dirPath+'/'+filename;

        // create subfolder if not exists
        if( !fs.existsSync(dirPath) ) fs.mkdirSync(dirPath);

        // copy file
        var is = fs.createReadStream(req.files.file.path)
        var os = fs.createWriteStream(filePath);
        util.pump(is, os, this);
    }, function(err) {
    // file moved, we are done, make response
        if(!err) {
            this.data.msg='file saved';
        }
        return jRespond(err,res,this.data);
    });
};

exports.update = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.delete = function(req,res) {
    return jRespond(new Error("not implemented"),res);
    // TODO del datei
};

