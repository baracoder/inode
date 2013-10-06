var Msg = require('./lib/msg');
var Search = require('./lib/search');
var User = require('./lib/user');
var Upload = require('./lib/upload');


$(function() {
    $('#a_more').click(function(e) {
        e.preventDefault();
        Search.more();
    }).hide();
    $('#form_q').submit(function(form) {
            form.preventDefault();
            var q = $('#q').val();
            Search.start(q);
    });
    $('.example_q').click(function() {
        $('#q').val($(this).text());
    });

    $('#form_login').submit(function(form) {
            form.preventDefault();
            var u = $('#login_username').val();
            var p = $('#login_password').val();
            User.login(u,p);
    });
    $('#btn_logout').click(function(form) {
            form.preventDefault();
            User.logout();
    });

    $('#btn_upload').click( Upload.addToQueue);
    $('#upload_tags').keyup(Upload.checkSubmitable);
    $('#upload_description').keyup(Upload.checkSubmitable);
    $('#btn_submit').click(Upload.submit);
    $('#btn_reset').click(function() {
        window.location.reload();
    });

    $('#li_upload a').click(function(e) {
        e.preventDefault();
        $('.nav li').removeClass('active');
        $('#li_upload').addClass('active');
        $('#div_login').hide();
        $('#div_upload').show();
        $('#div_search').hide();
    });
    $('#li_login a').click(function(e) {
        e.preventDefault();
        $('.nav li').removeClass('active');
        $('#li_login').addClass('active');
        $('#div_login').show();
        $('#div_search').hide();
        $('#div_upload').hide();
    });
    $('#li_search a').click(function(e) {
        e.preventDefault();
        $('.nav li').removeClass('active');
        $('#li_search').addClass('active');
        $('#div_login').hide();
        $('#div_search').show();
        $('#div_upload').hide();
    });
});
