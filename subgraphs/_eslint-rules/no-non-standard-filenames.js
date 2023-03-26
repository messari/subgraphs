module.exports = {
  // see https://github.com/messari/subgraphs/issues/1484
  // folder and file names must be in snake_case or kebab-case; leading "_" allowed.
  create: function (context) {
    return {
      Program(node) {
        const fileName = context.getFilename();
        const regex = /(\/([_a-z]+[_-]*[a-z]+)*)*(\.ts)?$/;
        if (!regex.test(fileName)) {
          context.report({
            node,
            message: `Filename '${fileName}' does not match the required pattern '${regex}' (single, snake_case, kebab-case)`,
          });
        }
      },
    };
  },
};
