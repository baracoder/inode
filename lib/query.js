var Q = require('q');

var Query = function (elasticClient) {

};

Query.prototype.createIndex = function () {
    return Q.ninvoke(document.elasticClient, 'createIndex', 'queries')
    .then(function(results) {
        // create or update indicies
        console.log('created:');
        console.log(results);

        // queries mapping
        var mkQueriesIndex = Q.ninvoke(document.elasticClient,'putMapping', 'queries','docsearch',{
            docsearch: {
                properties: {
                    query: { type:'string'},
                    count: { type:'long'}
                }
            }
        });
        return mkQueriesIndex;
    }).then(function(results) {
        console.log('updated:');
        console.log(results);

    }, function(err) {
        console.log(JSON.stringify(err,4))
        if(err.type == 'IndexAlreadyExistsException') {
            console.log('index up to date');
        } else {
            console.log('creatingIndex:'+err);
        }
    });
};

