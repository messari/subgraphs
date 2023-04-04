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
        const regex = /^([a-z0-9]+[_-]*[a-z0-9]+)*(\.ts)?$/;
        const neededPathParts = context.getFilename().split("subgraphs").pop();
        const parthParts = neededPathParts.split(path.sep).splice(1); //splice ignores the first ""
        parthParts.forEach((part) => {
          if (!regex.test(part)) {
            context.report({
              node,
              message: `${part} in ${neededPathParts} does not match single word, snake_case, or kebab-case naming convention`,
            });
          }
        });
      },
    };
  },
};
