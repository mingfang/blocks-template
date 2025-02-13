const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const packageJson = require('./package.json');

const port = Number.isInteger(
  Number(process.argv[process.argv.findIndex((val) => val === '--port') + 1])
)
  ? process.argv[process.argv.findIndex((val) => val === '--port') + 1]
  : 3002;

const sanitizeName = (name) => {
  return name
    .replace(/@/g, '_at_')
    .replace(/\//g, '_slash_')
    .replace(/-/g, '_dash_')
    .replace(/^[a-zA-Z0-9_]/g, '_');
};

const addRemoteEntryUrl = (content, absoluteFrom) => {
  const remoteEntryUrl = process.env.REMOTE_ENTRY_URL
  const scope = sanitizeName(packageJson.name);
  const meta = JSON.parse(content);
  meta.moduleFederation = {
    module: path.basename(absoluteFrom, '.json'),
    scope,
    version: packageJson.version,
    remoteEntryUrl: remoteEntryUrl || `http://localhost:${port}/remoteEntry.js`,
  };
  return JSON.stringify(meta);
};

module.exports = merge(common, {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: path.join(__dirname, 'dist'),
    host: '0.0.0.0',
    allowedHosts: 'all',
    port,
    historyApiFallback: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": process.env

    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/blocks/**/*.json',
          to: ({ absoluteFilename }) => {
            return path.join('meta', path.basename(absoluteFilename));
          },
          transform: addRemoteEntryUrl,
        },
      ],
    }),
  ],
});
