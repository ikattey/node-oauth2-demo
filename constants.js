const { Logger, transports } = require('winston');

const timestamp = () =>
  new Date().toLocaleDateString() + ' - ' + new Date().toLocaleTimeString();

const logger = new Logger({
  transports: [
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp
    })
  ],
  exitOnError: false // do not exit on handled exceptions
});

// create a stream object with a 'write' function. to be used by morgan
logger.stream = {
  write: message => {
    // log http requests as debug
    logger.debug(message);
  }
};

exports.logger = logger;

exports.GRANT_TYPES = [
  'refresh_token',
  'authorization_code',
  'password',
  'client_credentials'
];
exports.JOIN_TABLES = {
  clientGrantType: 'ClientGrantTypes'
};
