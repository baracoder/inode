var restler = require('restler');
var Q = require('q');


User = function () {

};

User.prototype.URL = 'http://infoini.de/redmine/users/current.json';

User.prototype.getRedmineUser = function(username,password) {
    var user = this;
    return Q.fcall(function() {
        var request = restler.request(user.URL,{
            username: username,
            password: password,
            query: {include: 'memberships' },
            parser: restler.parsers.json
        });
        var deferred = Q.defer();
        request.on('complete',function(result,response) {
            if(result instanceof Error) return deferred.reject(result);
            return deferred.resolve(result);
        });
        return deferred.promise;
    }).then(function(data) {
        return data.user;
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

