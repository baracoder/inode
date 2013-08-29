var restler = require('restler');
var flow = require('jar-flow');


User = function () {

};

User.prototype.URL = 'http://infoini.de/redmine/users/current.json';

User.prototype.getRedmineUser = function(username,password,callback) {
    var user = this;

    flow.exec(function() {

        var request = restler.request(user.URL,{
            username: username,
            password: password,
            query: {include: 'memberships' },
            parser: restler.parsers.json
        });

        var _flow = this;
        request.on('complete',function(result,response) {
            if(result instanceof Error) return _flow(result);
            return _flow(null,result);
        });

    }, function(err,data) {
        if(err) return callback(err);
        return callback(err,data.user);
    });
};

User.prototype.isAdmin = function(user) {
    if(user && user.memberships) {
        for(i in user.memberships) {
            if(user.memberships[i].project.id === 17) { // 17 = lernhilfen
                var roles = user.memberships[i].roles;
                console.log(roles);
                for(var j in roles) {
                    if(roles[j].id === 3) return true; // 3 = manager
                }
                break;
            }
        }
    }
    return false;
};

User.prototype.isMember = function(user) {
    if(user && user.memberships) {
        for(i in user.memberships) {
            if(user.memberships[i].project.id === 17) { // 17 = lernhilfen
                return true;
            }
        }
    }
    return false;

};

module.exports = User;


var main = function(){
    var username = process.argv[2];
    var password = process.argv[3];
    var user = new User();
    user.getRedmineUser(username,password,function(err,rmUser) {
        if(err) {
            return console.log('err:'+err);
        }
        console.log('name:',name);

        console.log('Memberships:');
        for(var i in rmUser.memberships) {
            var membership = rmUser.memberships[i];
            console.log(membership.project.name + ' - '+ membership.roles[0].name);
        }
    });
}

if (require.main === module) {
    main();
}

