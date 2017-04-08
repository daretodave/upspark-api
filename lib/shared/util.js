const format = require('dateformat');
const {inspect} = require('util');

const dateFormat = "dddd, mmmm dS, yyyy, h:MM:ss TT";
const emailValidatorExpression = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const messageFormat = part => {
    if (typeof part !== 'string') {
        part = inspect(part, {
            showHidden: true,
            depth: null
        })
    }
    return part;
};

module.exports = Util = {};

Util.SPACER = ' '.repeat(4);
Util.partial = (content, length = 25) => content && typeof content === 'string' ?
    (content.slice(0, length) + (content.length > length ? '...' : '')) :
    (content);
Util.simpleGUID = () => Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1).toUpperCase();

Util.message = (title) => {

    let message = {
        blocks: []
    };

    message.append = (...parts) => {
        let line =  Util.SPACER + parts.map(messageFormat).join("");
        message.blocks.push(line);
        return message;
    };

    message.appendList = (title, list) => {
        message.append(`${title} = [`, !list.length ? ']' : '');

        if(!list.length) {
            return message;
        }

        for (let block in list) {
            if(!list.hasOwnProperty(block)) {
                continue;
            }

            message.append(Util.SPACER, list[block], (+block === (list.length - 1) ? '' : ','));
        }

        return message.append(']');
    };

    message.toText = () => `| ${title} \n`
        + `${message.blocks.join("\n")}\n`
        + `| ${message.blocks.length ? '' : 'EMPTY'}`;

    message.log = () => {
        console.log(message.toText());

        return message;
    };

    return message;
};

Util.log = (...message) => {

    if (message.length === 0) {
        message = ['\n'];
    }

    console.log(message.map(messageFormat).join(""));

    let chain = {};

    chain.then =
        chain.log =
            chain.line = Util.log;

    return chain
};

Util.isValidEmail = (email) => emailValidatorExpression.test(email);

Util.date = (date = Date.now()) => format(date, dateFormat);