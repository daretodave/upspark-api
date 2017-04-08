const express = require('express');
const bodyParser = require('body-parser');
const format = require('dateformat');
const logger = require('morgan');
const app = express();

const {date, log} = require('./shared/util');
const feedback = require('./routes/feedback');

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/feedback', feedback);

app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;

    next(err);
});

app.use((err, req, res, next) => {
    log(err.stack || err);

    res.status(err.status || 500);
    res.send({
        error: err
    });
});

app.listen(4567, () => log(`upspark-api | ${date()}`));