var Q = require('q');

var jRespond = require('./utils').jRespond;


var Controller = function (user, bypassAuth) {
    this.user = user;
    this.bypassAuth = bypassAuth;
};

Controller.prototype.login = function(req,res) {
    var controller = this;
    if(!req.body.username || !req.body.password) {
        return jRespond(new Error('username or password missing'),res);
    }

    if(this.bypassAuth) {
        req.session.user = {
            login: true,
            admin: true
        };
        return jRespond(null,res,req.session.user);
    }

    this.user.getRedmineUser(req.body.username,req.body.password).then(function(user) {
        req.session.user = {
            login: controller.user.isMember(user),
            admin: controller.user.isAdmin(user)
        };
        return jRespond(null,res,req.session.user);
    }, function(err) {
        err = new Error('login failed');
        return jRespond(err, res);
    });
};

Controller.prototype.logout = function(req,res) {
    req.session.user = {
        login:false,
        admin:false
    };
    return jRespond(null,res,req.session.user);
};

Controller.prototype.status = function(req,res) {
    return jRespond(null,res,req.session.user);
};

module.exports = Controller;
