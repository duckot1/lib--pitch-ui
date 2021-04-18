const path = require("path");

module.exports = {
    stories: ['../src/**/*.stories.@(tsx|mdx)'],
    // Add any Storybook addons you want here: https://storybook.js.org/addons/
    addons: ['@storybook/addon-docs'],
    webpackFinal: async (config) => {
        config.module.rules.push({
            test: /\.scss$/,
            use: [
                "style-loader",
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        modules: {
                            localIdentName: "[name]__[local]--[hash:base64:5]",
                        },
                        importLoaders: 2,
                        sourceMap: false
                    }
                },
                {
                    loader: require.resolve('sass-loader'),
                    options: {
                        sourceMap: false
                    }
                }],
            include: path.resolve(__dirname, "../")
        });

        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            loader: require.resolve("babel-loader"),
            options: {
                presets: [["react-app", { flow: false, typescript: true }]]
            }
        });

        config.module.rules.push({
            test: /\.mdx$/,
            use: ['babel-loader', '@mdx-js/loader'],
        });

        config.resolve.extensions.push(".ts", ".tsx");

        return config;
    }
};