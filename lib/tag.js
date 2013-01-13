var elastical = require('elastical');


var ec = new elastical.Client();

var Tag = {};
module.exports = Tag;

Tag.getOrCreate = function(word,callback) {
    // TODO search in words
    ec.get('tags',word, function(err,doc,eRes) {
        console.log('searched word: '+word);
        if(err && err.message !== 'HTTP 404') return callback(err);
        if(err) {
            // tag does not exist, create it
            ec.index('tags','tag', {
                name: word,
                words: [word]
            },{
                id: word
            },function(err,eRes) {
                if(err) return callback(err);
                return callback(null,[word]);
            });
        } else {
            // tag exists, add all word to tags
            return callback(null,doc.words);
        }
    });
};

