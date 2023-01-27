const path = require('path');
module.exports = {
    mode: 'development',
    entry: './src/test.tsx', // Tells webpack where to start looking 
    module: { // allow webpack to handle other file times
        rules: [{
            use: 'ts-loader', 
            test: /\.tsx?$/,
            exclude: /node_modules/,
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'] // What file types apply modules to
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    }
}