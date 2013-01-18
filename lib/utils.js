exports.jRespond = function(err,res,data) {
    var response = {};
    if(err) {
        response.error = {
            name: err.name,
            message: err.message
        };
        console.error(err);
    }
    response.data = data;
    res.contentType('application/json');
    res.charset = 'utf-8';
    res.end(JSON.stringify(response));
};

