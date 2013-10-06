var child = require('child_process');
var Q = require('q');


var Extract = function (file, document, id, target) {
    this.file = file;
    this.document = document;
    this.id = id;
    this.target = target;
};

Extract.prototype.start = function () {
    var extract = this;
    return Q.fcall(function () {
        return extract.document.get(extract.target);
    }).then(function (doc) {
        console.log('extracting document: ' + extract.target);
        var files, i, all, path;

        extract.doc = doc[0];
        files = extract.doc.files;
        all = [];
        for (i = 0; i < files.length; i++) {
            path = extract.file.getPathById(files[i].id);
            all.push(extract.extractFile(path));
        }
        return Q.all(all);
    }).then(function (results) {
        var max_length, i, text = '';

        max_length = 40000;

        for (i = 0; i < results.length; i++) {
            text = text + results[i][0] + '\n';
        }
        text = text.substring(0, max_length);
        extract.doc.text = text;
        return extract.document.update(extract.target, extract.doc);
    });
};

Extract.prototype.extractFile = function (path) {
    return Q.nfcall(child.exec, 'nice ionice opt/cattext ' + path);
};

module.exports = Extract;
