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
