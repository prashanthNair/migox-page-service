var path = require('path'); 

// Helper functions
var ROOT = path.resolve(__dirname, '..');
const nodeExternals = require('webpack-node-externals');
const slsw = require('serverless-webpack');
const isLocal = slsw.lib.webpack.isLocal;

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [ROOT].concat(args));
}

module.exports = {
  mode:'development',
  entry: slsw.lib.entries, 
  target: 'node',
  devtool: 'source-map',
  externals: [nodeExternals()],  
  resolve: {
    extensions: ['.ts', '.js', '.json'],  
    modules: [root('src'),'node_modules']
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  },
  module: { 
    rules: [ 
      {
        test: /\.ts$/, 
        use: [ 
          { loader: 'ts-loader' }
           
        ],
        exclude: [/\.(spec|e2e)\.ts$/]
      }, 
    ]
  },
  plugins: [ 
  ],
};
