/**
 * Created by gewangjie on 2017/9/19
 */

let path = require('path');
let webpack = require('webpack');

module.exports = {
    devtool: 'eval-source-map',//生成Source Maps,这里选择eval-source-map
    entry: [
        'webpack/hot/dev-server',
        __dirname + '/app/main.js'
    ],//唯一入口文件,__dirname是node.js中的一个全局变量，它指向当前执行脚本所在的目录
    output: {
        path: __dirname + '/build',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()//热模块替换插件
    ],
    devServer: {
        contentBase: path.join(__dirname, "build"),
        compress: true,
        port: 8080
    }
};


