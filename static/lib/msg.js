
var Msg = {};
Msg.messages = [];
Msg.containerMsgs = $('#msgs');
Msg.append = function(type,text) {
        var msg = $('<p/>').html(text).addClass('alert').addClass(type);
        msg.click(function() {
            msg.remove();
        });
        this.messages.push(msg);
        this.containerMsgs.append(msg);
};

Msg.clear = function() {
    var i;
    for(i=0; i < this.messages.length; i++) {
        this.messages[i].remove();
    }
    this.messages = [];
};


module.exports = Msg;
