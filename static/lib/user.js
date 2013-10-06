var Msg = require('./msg');


var User = {login:false, admin: false};
User.login = function(username,password) {
    $.ajax({
            url:'../user/login',
            type: "POST",
            dataType: 'json',
            data:{
                username: username,
                password: password
            },
            success: function(data, textStatus, jqXHR) {
                console.log(data);
                if(data.error) {
                        Msg.append('alert-error',data.error.message);
                } else if(data.data.login === false) {
                        Msg.append('alert-error','login failed');
                } else {
                        Msg.append('alert-success','login successful');
                        User.user = data.data;
                        $('#li_search a').click();
                }
    }});
};

User.logout = function() {
    $.ajax({
            url:'../user/logout',
            type: "POST",
            dataType: 'json',
            success: function(data, textStatus, jqXHR) {
                console.log(data);
                Msg.append('alert-success','logout successful');
                User.user = {};
    }});
};


module.exports = User;
