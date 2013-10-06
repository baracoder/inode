var crypto = require('crypto');
var fs = require('fs');
var mime = require('mime');
var mmmagic = require('mmmagic');
var path = require('path');
var Q = require('q');




var File = function (storagePath) {
    this.storagePath = storagePath;

};

File.prototype.getPathById = function(file_id) {
    var subdir = file_id.substr(0,3);
    return './'+this.storagePath+'/'+subdir+'/'+file_id;
};

File.prototype.existsSync = function(file_id) {
    return fs.existsSync(this.getPathById(file_id));
};

File.prototype.getMimeForId = function(file_id) {
    return this.getMimeForPath(this.getPathById(file_id));
};

File.prototype.getMimeForPath = function(filePath) {
    var magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
    return Q.ninvoke(magic,'detectFile',filePath).then(function(mimeType) {
        if(mimeType === '') mimeType = 'application/octet-stream';
        return Q(mimeType);
    });
};

File.prototype.getSha1sum = function(filePath) {
    var deferred = Q.defer();
    var readStream = fs.ReadStream(filePath);
    var sha1 = crypto.createHash('sha1');

    readStream.on('data', function(d) {
        sha1.update(d);
    });
    readStream.on('error', deferred.reject.bind(deferred));

    readStream.on('end', function() {
        return deferred.resolve(sha1.digest('hex'));
    });
    return deferred.promise;
};

File.prototype.add = function(filePath) {
    var file = this;
    var data = {};
    return file.getSha1sum(filePath).then(function(sha1sum) {
        return file.getMimeForPath(filePath).then(function(mimeType) {
            // create id
            var extension = mime.extension(mimeType);
            if (extension === 'undefined') extension = 'bin';
            data.id = sha1sum +'.'+ extension;

            // check if file exists
            if(file.existsSync(data.id)) {
                throw new Error('file exists: '+data.id);
            }

            // create file name & foldername
            var storeFilePath = file.getPathById(data.id);
            var subDirPath = path.dirname(storeFilePath);

            // create subDir if not exists
            if( !fs.existsSync(subDirPath) ) fs.mkdirSync(subDirPath);

            var defer = Q.defer();

            // copy file
            var is = fs.createReadStream(filePath);
            var os = fs.createWriteStream(storeFilePath);
            is.on('error',defer.reject.bind(defer));
            is.on('end',defer.resolve.bind(defer));
            is.pipe(os);
            return defer.promise.then(function() {
                return Q(data);
            });
        });
    });
};

module.exports = File;
