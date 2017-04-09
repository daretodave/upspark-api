const express = require('express');
const router = express.Router();

const Util = require('../shared/util');
const Mailer = require('../shared/mailer');

router.post('/', (req, res) => {

    const {
        type,
        email,
        content,
        image
    } = req.body;

    const payload = {};

    payload.blocks = (content ? content.toString() : '').split(/\n|\r|\n\r|\r\n/g).map(line => line.trim()).filter(line => line);
    payload.compact = payload.blocks.join("").trim();

    const errors = validate(type, email, content, payload, image);
    const message = Util.message('feedback');

    message.append('feedback.type = ', type);
    message.append('feedback.email = ', email);
    message.append('feedback.content = ', Util.partial(payload.compact));
    message.append('feedback.image = ', Util.partial(image));
    message.appendList('feedback.errors', errors.map(error => error.toString()));

    const respond = (result) => {
        let payload = {};

        payload.trace = message.blocks;
        payload.errors = errors;

        if (typeof result !== 'undefined') {
            payload.result = result;

            message.append(`result = ${result}`);
        }

        res.send(payload);

        message.log();
    };

    if (errors.length) {
        res.status(400);

        respond();
        return;
    }

    const {sender, subject, contents, title} = types[type];

    const ticket = Util.simpleGUID();
    const submission = ["<b>Feedback:</b>", ...payload.blocks, " ", "<b>Email:</b>", email];

    if (image) {
        submission.push(" ", "<b>Attachment:</b>", `<img src="${image.trim()}" alt="${title}, #${ticket}">`)
    }

    Promise
        .all([
            Mailer.send(sender, {
                email: sender,
                subject: `${title} Submission - Ticket #${ticket}`,
                contents: submission
            }),
            Mailer.send(sender, {
                email,
                subject: `${subject} - Ticket #${ticket}`,
                contents
            })
        ])
        .then(() => respond())
        .catch(error => {
            Util.log(error);

            message.append("");
            message.append("Failed to send email to target!");

            res.status(500);

            respond();
        });

});

const validate = (type, email, content, payload, image) => {
    const errors = [];

    const error = (message, type) => errors.push({message, type, toString: () => `${type} - ${message}`});

    if (!type) {
        error("feedback.type not provided", 10);
    } else if (typeof type !== 'string') {
        error("feedback.type is not a string", 11);
    } else if (!types.hasOwnProperty(type)) {
        error("feedback.type is not valid", 12);
    }

    if (!email) {
        error("feedback.email not provided", 20);
    } else if (typeof email !== 'string') {
        error("feedback.email is not a string", 21);
    } else if (!Util.isValidEmail(email)) {
        error("feedback.email is not a valid email", 22);
    }

    if (!content) {
        error("feedback.content not provided", 30);
    } else if (typeof content !== 'string') {
        error("feedback.content is not a string", 31);
    } else {

        if (payload.compact.length < 10) {
            error("feedback.content is not long enough", 32);
        } else if (payload.compact.length > 500) {
            error("feedback.content is too long", 33);
        }
    }

    if (image && typeof image !== 'string') {
        error("feedback.image is not a string", 41);
    } else if (image) {
        const length = parseInt(
            image.replace(/=/g, "").length * 0.75
        );

        if (length > 75000) {
            error("feedback.image is over 75 KB", 42);
        }
    }

    return errors;
};

const types = {
    "bug": {
        "title": "Bug",
        "sender": "support@upspark.io",
        "subject": "Thanks for the bug report!",
        "contents": [
            "Hi there! ",
            "",
            "Thanks for your recent bug report. This is an automatic email just to let you know that we received your feedback successfully.",
            "",
            " We'll do our best to look at this bug as soon as we can. Until then, if you had any additional info or remarks - you can skip the form and just reply to this email.",
            "",
            "Thanks again!",
            "",
            "--",
            "Team Upspark",
        ],
    },
    "suggestion": {
        "title": "Suggestion",
        "sender": "feedback@upspark.io",
        "subject": "Thanks for the suggestion!",
        "contents": [
            "Hi there! ",
            "",
            "Thanks for your recent suggestion. This is an automatic email just to let you know that we received your feedback successfully.",
            "",
            "We'll do our best to look at this suggestion as soon as we can. Until then, if you had any additional info or remarks - you can skip the form and just reply to this email.",
            "",
            "Thanks again!",
            "",
            "--",
            "Team Upspark",
            ""
        ]
    },
    "kudos": {
        "title": "Kudos",
        "sender": "feedback@upspark.io",
        "subject": "Appreciate the feedback!",
        "contents": [
            "Hi there! ",
            "",
            "Thanks for your recent feedback. This is an automatic email just to let you know that we received your feedback successfully. ",
            "",
            "We value feedback and will do our best to look this over as soon as possible.",
            "",
            "In the meanwhile, if you had any follow up comments or even a question - simply reply to this email.",
            "",
            "Thanks again!",
            "",
            "--",
            "Team Upspark"
        ]
    }
};

module.exports = router;