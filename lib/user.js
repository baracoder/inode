var restler = require('restler');
var flow = require('jar-flow');


User = {};
User.url = 'http://infoini.de/redmine/users/current.json';

User.getRedmineUser = function(username,password,callback) {
    flow.exec(function() {

        var request = restler.request(User.url,{
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

User.isAdmin = function(user) {
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

User.isMember = function(user) {
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
    var user = process.argv[2];
    var pass = process.argv[3];
    User.getRedmineUser(user,pass,function(err,user) {
        if(err) {
            return console.log('err:'+err);
        }
        console.log('user:',user);

        console.log('Memberships:');
        for(var i in user.memberships) {
            var membership = user.memberships[i];
            console.log(membership.project.name + ' - '+ membership.roles[0].name);
        }
    });
}

if (require.main === module) {
    main();
}

