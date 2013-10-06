;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

},{}],2:[function(require,module,exports){
var Msg = require('./msg');


var Search = {};
Search.containerResults = $('#results');
Search.containerFacets = $('#facets');
Search.containerResultsCount = $('#resultsCount');
Search.btnMore = $('#a_more');
Search.resultsSize = 10;

Search.start = function(query) {
    if (query === '') {
        return Msg.append('allert-error','input empty');
    }

    this.query = query;
    this.results = [];
    this.containerResults.text('');
    this.resultsFrom = 0;
    this.facetsActive = [];

    this.execute();
};

Search.execute = function() {
        Msg.clear();
        var q = this.query;
        $.each(this.facetsActive,function(i,v) {
            q = '('+ q +') AND tag:'+v;
        });

        var _search = this;
        $.ajax({
                url:'../document/_search/'+encodeURI(q),
                dataType: 'json',
                data:{
                    from: this.resultsFrom,
                    size: this.resultsSize,
                },
                success: function(data, textStatus, jqXHR) {
                    if(data.error) {
                            Msg.append('alert-error',data.error.message);
                    } else {
                            _search.containerFacets.text('');
                            _search.containerResultsCount.text(data.data.hits.total+' insgesamt');
                            console.log(data.data);
                            var hits = data.data.hits.hits;
                            var i;
                            for(i = 0; i < hits.length; i++) {
                                _search.add(hits[i]);
                            }
                            var facets = data.data.facets.tag.terms;
                            for(i = 0; i < facets.length; i++) {
                                _search.addFacets(facets[i]);
                            }

                            if(data.data.hits.total - _search.resultsFrom-_search.resultsSize > 0) {
                                _search.btnMore.show();
                            } else {
                                _search.btnMore.hide();
                            }
                    }
        }});
};

Search.more = function() {
    this.resultsFrom += this.resultsSize;
    this.containerResults.find('.searchResult').addClass('muted');
    this.execute();
};

Search.add = function(hit) {
    var text_highlights = [];
    if(hit.highlight) {
        text_highlights = hit.highlight.text;
    }

    var files = hit._source.files;
    var description = hit._source.description;
    var downloads = [];
    var i;
    var fname;
    for(i = 0; i < files.length; i++) {
        fname = description.replace(/\//g, '_') + '.' + files[i].id.split('.')[1];
        downloads.push({
            num: (i+1).toString(),
            link: '../file/' + files[i].id + '/' + fname,
        });
    }
    var row = {
        downloads: downloads,
        description: description,
        tags: hit._source.tags.join(', '),
        has_highlights: text_highlights.length > 0,
        text_highlights: text_highlights,
    };

    var h = $(ich.search_row(row));

    this.results.push(h);
    this.containerResults.append(h);
};

Search.addFacets = function(facet) {
    var q = $('#q');
    var strTag = 'tag:'+facet.term;

    var f = $('<li><a href="#">'+facet.term+' ('+facet.count+')</a></li>');
    $(f).find('a').attr('term',facet.term);
    f.css('padding-right', '1em');
    if($.inArray(facet.term,  this.facetsActive)>-1) {
        f.addClass('active');
    }
    var _search = this;
    f.click(function(e) {
        e.preventDefault();
        f.toggleClass('active');
        if(f.hasClass('active')) {
            _search.facetsActive.push(facet.term);
        } else {
            var index = $.inArray(facet.term,  _search.facetsActive);
            if(index >-1) {
                _search.facetsActive.splice(index,1);
            }
        }
        _search.resultsFrom=0;
        _search.results = [];
        _search.containerResults.text('');
        _search.execute();
    });
    this.containerFacets.append(f);
};

Search.clear = function() {
    var i;
    for(i = 0; i < this.results.length; i++) {
        this.results[i].remove();
    }
    this.results = [];
};


module.exports = Search;

},{"./msg":1}],3:[function(require,module,exports){
var Msg = require('./msg');

var Upload = {};
Upload.uploadFiles = function(files) {
    var i;
    for(i=0; i < files.length; i++) {
        Upload._uploadFile(files[i]);
    }
};

Upload.queue = [];
Upload.ids = [];
Upload.queueContainer = $('#upload_files');
Upload.submitButton = $('#btn_submit');
Upload.inputTags = $('#upload_tags');
Upload.inputDescription = $('#upload_description');

Upload.addToQueue = function() {
    var iframeId = 'upload_frame'+this.iframeCount++;
    var statusText = $('<div class="alert alert-info"></div>');
    var upload_form = $('<form/>').append('<input style="display:none;" type="file" name="file"/>')
    .append(statusText)
    .appendTo(Upload.queueContainer)
    .find('input').click().change(function(e) {
        upload_form.submit();
        statusText.text('lade.. '+this.files[0].name);
    })
    .submit(function(e) {
        e.preventDefault();
        var data = new FormData();
        var fileName = this.files[0].name;
        data.append('file', this.files[0]);
        // Ajax-Call
        $.ajax({
            url: '../file',
            data: data,
            type: 'POST',
            processData: false,
            contentType: false,
            success: function(data, textStatus, jqXHR) {
                statusText.removeClass('alert-info');
                if(data.error) {
                    Upload.ids.push(data.data.id);
                    return  statusText.text(data.error.message);
                }
                statusText.addClass('alert-success');
                statusText.text('OK '+fileName);
                Upload.ids.push(data.data.id);
                Upload.checkSubmitable();
            }
        });
    });

    Upload.queue.push(upload_form);
};

Upload.submittable = function() {
    return Upload.inputDescription.val() !== '' &&
        Upload.inputTags.val().split(',').length>=3 &&
        Upload.ids.length>0;
};

Upload.checkSubmitable = function() {
    if(Upload.submittable()) {
        Upload.submitButton.removeClass('disabled');
    } else {
        Upload.submitButton.addClass('disabled');
    }
};
Upload.submit = function() {
    if(!Upload.submittable()) return;
    // todo strip spaces from tags
    $.ajax({
            url:'../document',
            type: "POST",
            dataType: 'json',
            data:{
                description: Upload.inputDescription.val(),
                tags: Upload.inputTags.val().split(','),
                files: Upload.ids
            },
            success: function(data, textStatus, jqXHR) {
                console.log(data);
                if(data.error) {
                        Msg.append('alert-error',data.error.message);
                } else {
                        Msg.append('alert-success','upload successful');
                }
    }});
};

module.exports = Upload;

},{"./msg":1}],4:[function(require,module,exports){
var Msg = require('./msg');


var User = {};
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
    }});
};


module.exports = User;

},{"./msg":1}],5:[function(require,module,exports){
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

},{"./lib/msg":1,"./lib/search":2,"./lib/upload":3,"./lib/user":4}]},{},[5])
;