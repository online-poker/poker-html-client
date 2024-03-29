const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('mini-css-extract-plugin');
//const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;
const bundleOutputDir = './dist';

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);
    return [{
        stats: { modules: false },
        entry: { 'poker-html-client': './js/appInit' },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: {
                "poker": path.join(__dirname, "js"),
                "tests": path.join(__dirname, "tests"),
            }
        },
        externals: {
            jquery: 'commonjs jquery',
            moment: 'commonjs moment',
            knockout: 'commonjs knockout',
            signals: 'commonjs signals',
            signalr: 'commonjs signalr',
            iscroll: 'commonjs iscroll',
            'knockout.validation': 'commonjs knockout.validation',
        },
        output: {
            path: path.join(__dirname, bundleOutputDir),
            filename: '[name].js',
            publicPath: 'dist/',
            library: {
                //root: "PokerClient",
                //amd: 'poker-html-client',
                //commonjs: "poker-html-client",
                //commonjs: {
                    //name: 'poker-html-client',
                    //type: 'commonjs',
                    //export: ['bootstrap']
                //},
                //export: ['bootstrap']
                name: 'poker-html-client',
                type: 'umd',
                //export: "default"
            },
            //libraryTarget: "umd",
            //umdNamedDefine: true
        },
        module: {
            rules: [
                { test: /\.(tsx|ts)?$/, include: /js/, use: 'ts-loader?silent=true' },
                { test: /\.css$/, use: isDevBuild ? ['style-loader', 'css-loader'] : ExtractTextPlugin.extract({ use: 'css-loader?minimize' }) },
                { test: /\.(png|jpg|jpeg|gif|svg)$/, use: 'url-loader?limit=25000' }
            ]
        },
        plugins: [
            //new CheckerPlugin(),
        ].concat(isDevBuild ? [
            // Plugins that apply in development builds only
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map', // Remove this line if you prefer inline source maps
                moduleFilenameTemplate: path.relative(bundleOutputDir, '[resourcePath]') // Point sourcemap entries to the original file locations on disk
            })
        ] : [
                // Plugins that apply in production builds only
                new webpack.optimize.UglifyJsPlugin(),
                new ExtractTextPlugin('site.css')
            ])
    }];
};
