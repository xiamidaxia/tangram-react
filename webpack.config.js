const webpack = require('webpack')
const path = require('path')

module.exports = {
  context: path.join(__dirname, './example'),
  entry: {
    jsx: './index.js',
    html: './index.html',
    vendor: [
      'react',
      'react-dom',
    ],
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'file?name=[name].[ext]',
      },
      {
        test: /\.less$/,
        loaders: [
          'style-loader',
          'css-loader?modules&camelCase&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
          'less-loader',
        ],
      },
      {
        test: /\.css$/,
        loader: 'style!css',
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: [
          'react-hot',
          'babel-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development') },
    }),
    new webpack.SourceMapDevToolPlugin({
      exclude: /node_modules/,
    }),
  ],
  devServer: {
    contentBase: './example',
    hot: false,
  },
}
