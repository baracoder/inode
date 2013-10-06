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
