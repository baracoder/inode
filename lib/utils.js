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
    res.end(JSON.stringify(response));
};
