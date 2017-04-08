const nodemailer = require('nodemailer');
const auth = require('../config/auth.json');
const inlineBase64 = require('nodemailer-plugin-inline-base64');

module.exports = Mailer = {};

Mailer.send = (sender, config) => {
    const {
        password = auth[sender],
        service = 'gmail',
        from = `"Team Upspark" <${sender}>`,
        email,
        subject,
        contents
    } = config;

    let options = {};

    options.from = from;
    options.to = email;
    options.subject = subject;

    if(Array.isArray(contents)) {
        options.html = contents.join("<br>");
    } else {
        options.html = contents.replace(/\n|\r|\n\r|\r\n/g, '<br>');
    }

    let transport = {};

    transport.auth = {};
    transport.auth.user = sender;
    transport.auth.pass = password;
    transport.service = service;

    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport(transport);
        transporter.use('compile', inlineBase64({cidPrefix: `upspark_`}));
        transporter.sendMail(options, (error, info) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(info);
        });
    });
};