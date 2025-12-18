// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': __dirname,
};

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = {
  ...config,
  server: {
    ...config.server,
    enhanceMiddleware: (metroMiddleware, server) => {
      return (req, res, next) => {
        res.on('finish', () => {
          if (res.statusCode === 500 && req.headers['aipa'] !== 'true') {
            const url = 'http://' + req.headers.host + req.url;
            console.log('__COMPILE_ERROR_START__' + url + '__COMPILE_ERROR_END__')
          }
        })
        return metroMiddleware(req, res, next);
      };
    },
  },
};
