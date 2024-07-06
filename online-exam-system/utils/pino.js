const pino = require("pino");
const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            destination: `logs.log`,
             colorize: true
        }
    },
});

module.exports = { logger }