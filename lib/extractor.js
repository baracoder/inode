var child = require('child_process');
var flow = require('jar-flow');

var Document = require('./document');
var File = require('./file');
console.log(Document);

var Extractor = {};
module.exports = Extractor;



Extractor.count = 0;
Extractor.max = 2;
Extractor.queue = [];
Extractor.add = function(documentId) {
    console.log('add: ' + documentId);
    this.queue.push(documentId);
    this.check();
};
Extractor.check = function() {
    console.log('Extractor queye '+ this.queue.length+' items');
    if(this.queue.length > 0 && this.count < this.max) {
        var documentId = this.queue.shift();
        this.start(documentId);
    }
};
Extractor.start = function(documentId) {
    Extractor.count++;
    flow.exec(function() {
        console.log('start:'+documentId);
        Document.get(documentId,this);
    },function(err,doc) {
        if(err) return this(err);
        this.doc = doc;
        var files = doc.files;
        for(var i in files) {
            var path = File.getPathById(files[i].id);
            Extractor.extractFile(path,this.MULTI());
        }
    },function(results) {
        if(!(results instanceof Array)) return this(results);
        var text = '';
        for(var i in results) {
            if(results[i]['0']) {
                return this(results[i]['0']);
            }
            text = text +' ' +results[i]['1'];
        }
        var max_length = 40000; // TODO set from config
        text = text.substring(0,max_length);
        this.doc.text = text;
        Document.update(documentId, this.doc,function(err,doc) {
        });
        return this();
    },function() {
        Extractor.count--;
        Extractor.check();
    });
};

Extractor.extractFile = function(path,callback) {
    child.exec('nice opt/cattext '+path, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        callback(error,stdout);
    });
};

