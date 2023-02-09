const path = require('path');
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    // Tells webpack where to start looking
    entry: {
        index: path.resolve('src/index.tsx'),
        background: path.resolve('src/background/background.ts')
    },  
    module: { // allow webpack to handle other file times
        rules: [{
            use: 'ts-loader', 
            test: /\.tsx?$/,
            exclude: /node_modules/,
        },
        {
            use: ['style-loader', 'css-loader'],
            test: /\.css$/i
        },
        {
            type: 'assest/resource',
            test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/
        }
    ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: path.resolve('src/manifest.json'),
                to: path.resolve('dist')
            }]
        }),
        ...getHtmlPlugins([
            'index',
        ]),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'] // What file types apply modules to
    },
    output: {
        filename: '[name].js',
        path: path.resolve('dist')
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    
}

function getHtmlPlugins(chunks) {
    return chunks.map(chunk => new HtmlPlugin({
        title: 'React Extensions',
        filename: `${chunk}.html`,
        chunks: [chunk]
    }))
}