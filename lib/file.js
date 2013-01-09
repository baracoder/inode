var crypto = require('crypto');
var fs = require('fs');
var util = require('util');
var elastical = require('elastical');
var flow = require('jar-flow');
var mime = require('mime');
var mmmagic = require('mmmagic');

var jRespond = require('./utils').jRespond;

var ec = new elastical.Client();

// TODO settings
var storeDir = 'storage';


exports.find = function(req,res) {
    return jRespond(new Error("not implemented"),res);
};
exports.get = function(req,res) {
    var sha1 = req.params.sha1;
    ec.get('files',sha1, function(err,doc,eRes) {
        if(err) return res.end(500,'');

        var subdir = sha1.substr(0,3);
        console.log(doc);
        var extension = mime.extension(doc.mimeType) || 'bin';
        var path = './'+storeDir+'/'+subdir+'/'+sha1+'.'+extension;
        console.log(path);
        res.setHeader('Content-disposition', 'attachment; filename='+sha1+'.'+extension);
        return res.sendfile(path);
    });
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
    // inspect file for mime
        var magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
        magic.detectFile(req.files.file.path, this);

    }, function(err,mimeType) {
        if(err) return this(err);
        if(mimeType === '') mimeType = 'application/octet-stream';
        this.mimeType = mimeType;

        ec.index('files','file', {
            text: '', // TODO index text
            missing: false,
            size: req.files.file.size,
            mimeType: mimeType
        }, { // options
            id: this.data.id
        }, this );
    }, function(err,eRes) {
    // indexed file
        if(err) return this(err);
        console.log('indexed');
        this.file = eRes;

        // create file name & foldername
        var extension = mime.extension(this.mimeType) || 'bin';
        var filename = this.data.id+'.'+extension;
        var dirname = this.data.id.substr(0,3);
        var dirPath = storeDir+'/'+dirname;
        var filePath = dirPath+'/'+filename;

        // create subfolder if not exists
        if( !fs.existsSync(dirPath) ) fs.mkdirSync(dirPath);

        // copy file
        var is = fs.createReadStream(req.files.file.path)
        var os = fs.createWriteStream(filePath);
        var _flow = this;
        is.pipe(os);
        is.on('end',function() {
            _flow();
        });


    }, function(err) {
    // file moved, we are done, make response
        // remove tempirary file independend of error
        fs.unlinkSync(req.files.file.path);
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

