const { transformSync } = require("@babel/core");
const transformReactJsxSourcePlugin = require("@babel/plugin-transform-react-jsx-source");
const sanitizeSourcePathsPlugin = require("../babel-plugin-sanitize-source-paths.js");

const BABEL_PARSER_PLUGINS = [
  "jsx",
  "typescript",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  "topLevelAwait",
  "importAttributes",
];

module.exports = function addReactSourceMetadataLoader(source, inputSourceMap) {
  this.cacheable?.(true);

  const callback = this.async();

  try {
    const transformResult = transformSync(source, {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      sourceMaps: this.sourceMap,
      inputSourceMap: inputSourceMap || undefined,
      parserOpts: {
        sourceType: "module",
        plugins: BABEL_PARSER_PLUGINS,
      },
      generatorOpts: {
        retainLines: true,
      },
      plugins: [transformReactJsxSourcePlugin, sanitizeSourcePathsPlugin],
    });

    callback(null, transformResult?.code ?? source, transformResult?.map ?? inputSourceMap);
  } catch (error) {
    callback(error);
  }
};
