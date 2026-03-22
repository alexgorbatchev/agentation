const path = require("path");
const webpack = require("webpack");
const { version: agentationVersion } = require("../agentation/package.json");

const agentationSourceEntryPath = path.resolve(__dirname, "../agentation/src/index.ts");
const agentationSourcePath = path.resolve(__dirname, "../agentation/src");
const exampleSourcePath = path.resolve(__dirname, "src");
const addReactSourceMetadataLoaderPath = path.resolve(
  __dirname,
  "loaders/add-react-source-metadata-loader.js",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Allow importing from parent directory (the package source)
  transpilePackages: ["@alexgorbatchev/agentation"],
  webpack: (config, { dev }) => {
    if (!dev) {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        include: [exampleSourcePath, agentationSourcePath],
        enforce: "pre",
        use: [
          {
            loader: addReactSourceMetadataLoaderPath,
          },
        ],
      });
    }

    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(agentationVersion),
      }),
    ];

    if (dev) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@alexgorbatchev/agentation$": agentationSourceEntryPath,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
