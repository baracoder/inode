var flow = require('jar-flow');

var User = require('./user.js');
var jRespond = require('./utils').jRespond;
var config = require('../config');

var Controller = {};
module.exports = Controller;

Controller.login = function(req,res) {
    if(!req.body.username || !req.body.password) {
        return jRespond(new Error('username or password missing'),res);
    }

    if(config.bypassAuth) {
        req.session.user = {
            login: true,
            admin: true
        };
        return jRespond(null,res,req.session.user);
    }

    User.getRedmineUser(req.body.username,req.body.password, function(err,user) {
        if(err) err = new Error('login failed');
        req.session.user = {
            login: User.isMember(user),
            admin: User.isAdmin(user)
        };
        return jRespond(null,res,req.session.user);
    });
};

Controller.logout = function(req,res) {
    req.session.user = {
        login:false,
        admin:false
    };
    return jRespond(null,res,req.session.user);
};

Controller.status = function(req,res) {
    return jRespond(null,res,req.session.user);
};
