const path = require("node:path");

function toProjectRelativePath(filePath, cwd) {
  const relativePath = path.relative(cwd, filePath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return filePath;
  }

  return relativePath.split(path.sep).join("/");
}

function sanitizeStringLiteral(node, cwd) {
  if (typeof node.value !== "string") {
    return;
  }

  node.value = toProjectRelativePath(node.value, cwd);
}

module.exports = function sanitizeSourcePathsPlugin(babel) {
  const { types: t } = babel;

  return {
    name: "sanitize-source-paths",
    visitor: {
      Program: {
        exit(programPath, state) {
          const cwd = state.cwd || state.file.opts.cwd || process.cwd();

          programPath.traverse({
            VariableDeclarator(variablePath) {
              if (
                !t.isIdentifier(variablePath.node.id) ||
                !variablePath.node.id.name.includes("jsxFileName") ||
                !t.isStringLiteral(variablePath.node.init)
              ) {
                return;
              }

              sanitizeStringLiteral(variablePath.node.init, cwd);
            },
            ObjectProperty(propertyPath) {
              const key = propertyPath.node.key;
              const isFileNameKey =
                (t.isIdentifier(key) && key.name === "fileName") ||
                (t.isStringLiteral(key) && key.value === "fileName");

              if (!isFileNameKey || !t.isStringLiteral(propertyPath.node.value)) {
                return;
              }

              sanitizeStringLiteral(propertyPath.node.value, cwd);
            },
          });
        },
      },
    },
  };
};
