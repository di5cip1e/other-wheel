const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production' || process.env.NODE_ENV === 'production';
  
  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/engines': path.resolve(__dirname, 'src/engines'),
        '@/models': path.resolve(__dirname, 'src/models'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/managers': path.resolve(__dirname, 'src/managers'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        title: 'Wheel within a Wheel Game',
      }),
    ],
    devServer: {
      static: './dist',
      hot: true,
      open: true,
      port: 3000,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
      ...(isProduction && {
        minimize: true,
        minimizer: [
          '...',
        ],
      }),
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 300000, // 300KB
      maxAssetSize: 300000, // 300KB
    },
  };
};