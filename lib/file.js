var config = require('../config');

var crypto = require('crypto');
var fs = require('fs');
var flow = require('jar-flow');
var mime = require('mime');
var mmmagic = require('mmmagic');
var path = require('path');




var File = {};
module.exports = File;

File.getPathById = function(file_id) {
    var subdir = file_id.substr(0,3);
    return './'+config.storagePath+'/'+subdir+'/'+file_id;
};

File.existsSync = function(file_id) {
    return fs.existsSync(this.getPathById(file_id));
};

File.getMimeForId = function(file_id, callback) {
    return this.getMimeForPath(this.getPathById(file_id),callback);
};

File.getMimeForPath = function(filePath, callback) {
    var magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
    magic.detectFile(filePath, function(err,mimeType) {
        if(err) return callback(err);
        if(mimeType === '') mimeType = 'application/octet-stream';
        callback(err,mimeType);
    });
};

File.getSha1sum = function(filePath, callback) {
    var readStream = fs.ReadStream(filePath);
    var sha1 = crypto.createHash('sha1');

    readStream.on('data', function(d) {
        sha1.update(d);
    });
    readStream.on('error', callback);
    readStream.on('end', function() {
        return callback(undefined,sha1.digest('hex'));
    });
};

File.add = function(filePath, callback) {
    flow.exec(function() {
        // calc sha1sum
        this.data = {};
        File.getSha1sum(filePath, this);
    }, function(err,sha1sum) {
        if(err) return this(err);
        // sha1 calculated
        this.sha1sum = sha1sum;

        // detect mime type
        File.getMimeForPath(filePath, this);
    }, function(err,mimeType) {
        if(err) return this(err);
        // mime detected
        // create id
        this.data.id = this.sha1sum +'.'+ mime.extension(mimeType) || 'bin';

        // check if file exists
        if(File.existsSync(this.data.id)) {
            return this(new Error('file exists: '+this.data.id));
        }

        // create file name & foldername
        var storeFilePath = File.getPathById(this.data.id);
        var subDirPath = path.dirname(storeFilePath);

        // create subDir if not exists
        if( !fs.existsSync(subDirPath) ) fs.mkdirSync(subDirPath);

        // copy file
        var is = fs.createReadStream(filePath);
        var os = fs.createWriteStream(storeFilePath);
        is.on('error',this);
        is.on('end',this);
        return is.pipe(os);
    },function(err) {
        return callback(err,this.data);
    });
};

