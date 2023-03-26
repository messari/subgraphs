const { isImportDeclaration } = require("typescript");

module.exports = {
  create: function (context) {
    return {
      Literal(node) {
        //const regex = /^[^']*$/;
        //if (!regex.test(node.value)) {
        if (!isImportDeclaration(node) && typeof node.value === "string") {
          context.report({
            node,
            message: `${node.value}: String literals are not allowed`,
          });
        }
      },
    };
  },
};
