module.exports = function(api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            ['@react-dev-inspector/babel-plugin'],
            [
              'module-resolver',
              {
                root: ['./'],
                alias: {
                  '@': './'
                },
              },
            ],
        ],
    };
}