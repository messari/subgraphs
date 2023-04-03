module.exports = {
  // see https://github.com/messari/subgraphs/issues/1484
  // folder and file names must be in snake_case or kebab-case; leading "_" allowed.
  create: function (context) {
    return {
      Program(node) {
        const regex = /^([_a-z0-9]+[_-]*[a-z0-9]+)*(\.ts)?$/;
        const neededPathParts = context.getFilename().split("subgraphs").pop();
        const parthParts = neededPathParts.split("/").splice(1);
        parthParts.forEach((part) => {
          if (!regex.test(part)) {
            context.report({
              node,
              message: `'${part}' in ${neededPathParts} ${regex.test(
                part
              )} does not match single word, snake_case, or kebab-case`,
            });
          }
        });
      },
    };
  },
};
