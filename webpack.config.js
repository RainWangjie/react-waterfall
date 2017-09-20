/**
 * Created by gewangjie on 2017/9/19
 */

let path = require('path');
let webpack = require('webpack');

module.exports = {
    devtool: 'eval-source-map',//生成Source Maps,这里选择eval-source-map
    entry: [
        'webpack/hot/dev-server',
        './app/main'
    ],//唯一入口文件,__dirname是node.js中的一个全局变量，它指向当前执行脚本所在的目录
    output: {
        path: path.join(__dirname, "./build"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {           // 如果没有options这个选项将会报错 No PostCSS Config found
                            plugins: (loader) => [
                                require('autoprefixer')(), //CSS浏览器兼容
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        require('autoprefixer'),
        new webpack.HotModuleReplacementPlugin(),//热模块替换插件
        new webpack.BannerPlugin('版权所有，翻版必究')
    ],
    devServer: {
        contentBase: path.join(__dirname, "build"),
        compress: true,
        historyApiFallback: true,//不跳转
        inline: true,//实时刷新
        port: 8080
    }
};


