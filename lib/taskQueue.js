var Q = require('q');
var os = require("os");

var Extract = require('./tasks/extract.js');


/*
    TaskQueue

    Executes background tasks
    Tasks are saved in the database with their status
    maxTasks are executed at once

*/
var TaskQueue = function (elasticClient, file, document, options) {
    this.elasticClient = elasticClient;
    this.file = file;
    this.document = document;
    this.interval = null;
    this.autoStart = true;
    if (options) {
        this.autoStart = options.start;
    }

    this.running = 0;
    this.maxTasks = options.maxTasks || 2;
    this.INDEX_VERSION = 1;

    this.INDEX_NAME = 'tasks-' + this.INDEX_VERSION;

    var q= this.createIndex();
    if (this.autoStart) {
        q.then(Q.fcall(this.start.bind(this)));
    }
};

TaskQueue.prototype.STATUS_PENDING    = 'pending';
TaskQueue.prototype.STATUS_COMPLETE   = 'complete';
TaskQueue.prototype.STATUS_PROCESSING = 'processing';
TaskQueue.prototype.STATUS_FAILED     = 'failed';

TaskQueue.prototype.createIndex = function () {
    var taskQueue = this;

    console.log('creating/updating taskQueue index...');
    return Q.ninvoke(taskQueue.elasticClient, 'createIndex', taskQueue.INDEX_NAME).then(function (results) {
        // create or update indicies
        console.log('created:');
        console.log(results);

        // mapping
        return Q.ninvoke(taskQueue.elasticClient, 'putMapping', taskQueue.INDEX_NAME, 'task', {
            document: {
                properties: {
                    type: { type: 'string'},
                    worker: { type: 'string'},
                    issued: {type: 'date'},
                    started: {type: 'date'},
                    finished: {type: 'date'},
                    status: { type: 'string'},
                    error: { type: 'string'},
                    target: { type: 'string'}
                }
            }
        });
    }).then(function (results) {
        console.log('updated:');
        console.log(results);
        return Q(true);
    }, function (err) {
        if (err.message.indexOf('IndexAlreadyExistsException') === 0) {
            console.log('index up to date');
            return Q(true);
        }
        throw err;
    });
};


TaskQueue.prototype.push = function (type, target) {
    console.log('push');
    return this.index({
        type: type,
        issued: new Date().toISOString(),
        status: this.STATUS_PENDING,
        target: target
    });
};

TaskQueue.prototype.start = function () {
    if (this.isRunning()) {
        return;
    }
    this.interval = setInterval(this.next.bind(this), 2000);
};

TaskQueue.prototype.stop = function () {
    clearInterval(this.interval);
    this.interval = null;
};

TaskQueue.prototype.isRunning = function () {
    return this.interval !== null;
};

TaskQueue.prototype.next = function (options) {
    var free_slots, taskQueue = this;

    console.log('tasks running: ' + this.running + ' of max ' +this.maxTasks);
    if (this.running >= this.maxTasks) {
        return Q(false);
    }
    free_slots = this.maxTasks - this.running;
    this.list({
        size: free_slots,
        status: this.STATUS_PENDING,
        sortAsc: true,
    }).then(function (results) {
        if (results[1].hits.hits.length === 0) {
            console.log('not tasks to run');
        }
        results[1].hits.hits.forEach(taskQueue.begin.bind(taskQueue));
    }).done();
};

TaskQueue.prototype.begin = function (result) {
    // get next n tasks, set status processing
    // create tasks of type, register callback, run task
    this.running += 1;
    var id = result._id,
        taskDoc = result._source,
        taskQueue = this;
    taskDoc.status = this.STATUS_PROCESSING;
    taskDoc.worker = os.hostname();
    taskDoc.started = new Date().toISOString();
    return this.index(taskDoc, id).then(function () {
        // TODO verify, that no other worker snatched the job:
        // get document, check revision
        var task;
        if (taskDoc.type === 'extract') {
            task = new Extract(taskQueue.file, taskQueue.document, id, taskDoc.target);
        }
        task.start().then(function () {
            taskQueue.finished(id);
        }, function (err) {
            taskQueue.failed(id, err);
        }).done();
    });
};

TaskQueue.prototype.finished = function (taskId) {
    var taskQueue = this;
    console.log('task finished: ' + taskId);
    this.running -= 1;
    return this.get(taskId).then(function (taskDoc) {
        taskDoc.status = taskQueue.STATUS_COMPLETE;
        taskDoc.finished = new Date().toISOString();
        return taskQueue.index(taskDoc, taskId);
    });
};

TaskQueue.prototype.failed = function (taskId, err) {
    var taskQueue = this;
    console.log('task failed: ' + taskId + ': ' + err.message);
    this.running -= 1;
    return this.get(taskId).then(function (taskDoc) {
        taskDoc.status = taskQueue.STATUS_FAILED;
        taskDoc.finished = new Date().toISOString();
        taskDoc.error = err;
        return taskQueue.index(taskDoc, taskId);
    });
};


TaskQueue.prototype.list = function (options) {
    var queryOptions = {
        sort: [
            { issued : { order : 'desc' } },
        ],
        query: {
            term : {},
        },
    };
    queryOptions.index = this.INDEX_NAME;

    // add options, if availible
    queryOptions.size = options.size || 100;
    queryOptions.from = options.from || 0; // offset
    queryOptions.query.term.type = options.type;
    queryOptions.query.term.status = options.status;
    if (options.sortAsc) {
        queryOptions.sort[0].issued.order = 'asc';
    }
    return Q.ninvoke(this.elasticClient, 'search', queryOptions);
};

TaskQueue.prototype.get = function (id) {
    return Q.ninvoke(
        this.elasticClient,
        'get',
        this.INDEX_NAME, id
    );
};

TaskQueue.prototype.index = function (source, id) {
    var options = { refresh: true};
    if (id) {
        options.id = id;
    }
    return Q.ninvoke(
            this.elasticClient,
        'index',
        this.INDEX_NAME, 
        'task',
        source,
        options
    );
};

module.exports = TaskQueue;
