var crypto = require('crypto');
var fs = require('fs');
var elastical = require('elastical');

var ec = new elastical.Client();


exports.find = function(req,res) {
    console.info("not implemented");
};
exports.get = function(req,res) {
    console.info("not implemented");
};

var add_functions = {
    
};

exports.add = function(req,res) {
    var s = fs.ReadStream(req.files.file.path);
    var sha1 = crypto.createHash('sha1');
    s.on('data', function(d) {
        sha1.update(d);
    });
    s.on('end', function() {
        var sha1sum =  sha1.digest('hex');
        // TODO index auf doppelgänger prüfen
        ec.get('file',sha1sum, function(err,doc,eres) {
            console.log('got');
            console.log(err);
            if(err) {
                ec.index('file','file', {
                    text: '', // TODO index text
                    missing: false,
                    mimieType: req.files.file.type
                }, { // options
                    id: sha1sum
                }, function(err,eres) {
                    console.log('indexed');
                    // TODO datei verschieben
                    res.end(sha1sum);
                });
            } else {
                console.log('doc exists');
                res.end('document exists');
                console.log(doc);
            }
        });
    });
};
exports.update = function(req,res) {
    console.info("not implemented");
    res.end('not implemented');
};
exports.delete = function(req,res) {
    console.info("not implemented");
    // TODO del datei
};

