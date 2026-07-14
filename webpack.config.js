const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./assets/index.tsx",
  target: "web",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
    publicPath: '/'
  },
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
  },
  devServer: { 
    historyApiFallback: true,
    inline: true,
    contentBase: [
      path.resolve(__dirname, "build"),
      path.resolve(__dirname, "."),
    ],
    port: 8080, 
    proxy: {
      '/emotions': {
        target: 'http://localhost:3000',
        secure: false,
      },
      '/costumes': {
        target: 'http://localhost:3000',
        secure: false,
      },
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
      },
      {
        enforce: "pre",
        test: /\.js$|jsx/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Persona 5 Generator',
      template: path.resolve(__dirname, "index.html"),
    }),
  ],
};
