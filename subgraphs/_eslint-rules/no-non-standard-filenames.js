var path = require("path");

module.exports = {
  // see https://github.com/messari/subgraphs/issues/1484
  // folder and file names must be in snake_case or kebab-case.
  meta: {
    docs: {
      description:
        "filename and folder name must be in snake_case or kebab-case",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      forbidden: "filename and folder name must be in snake_case or kebab-case",
    },
  },

  create: function (context) {
    return {
      Program(node) {
        const pathRegex = /^([a-z]+[_-]*[a-z0-9]+)*(\.ts)?$/; //snake_case or kebab-case
        const camelCaseRegex = /^[a-z]+[a-zA-Z0-9]*\.ts$/; // camelCase for ts
        const PascalCaseRegex = /^[A-Z]+[a-zA-Z0-9]*\.json$/; // PascalCase for abis (json)
        const fullFileName = context.getFilename();
        const neededPathParts = fullFileName.split("subgraphs").pop();
        const parthParts = neededPathParts.split(path.sep);
        parthParts.slice(1, parthParts.length - 1).forEach((part) => {
          if (!pathRegex.test(part)) {
            context.report({
              node,
              message: `folder name '${part}' in ${neededPathParts} does not match snake_case or kebab-case naming convention`,
            });
          }
        });
        const fileName = path.basename(fullFileName);
        const fileExt = path.extname(fullFileName).toLowerCase();
        if (fileExt === ".ts" && !camelCaseRegex.test(fileName)) {
          context.report({
            node,
            message: `file name ${fileName} does not match camelCase naming convention`,
          });
        }
        if (fileExt === ".json" && !PascalCaseRegex.test(fileName)) {
          context.report({
            node,
            message: `file name ${fileName} does not match PascalCase naming convention`,
          });
        }
      },
    };
  },
};
