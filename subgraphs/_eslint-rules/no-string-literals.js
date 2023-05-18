module.exports = {
  meta: {
    docs: {
      description:
        "string literals is only allowed in log argument or in UPPER_CASE variable in constants.ts or in logs",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      forbidden:
        "String literal must be in log argument or UPPER_CASE variable",
    },
  },

  create: function (context) {
    function checkLogCallOrStringMethods(node, ancestors, logValue) {
      // allowed methods using string literal as arguments
      // e.g. Bytes.fromHexString("0x123456789abcdef")
      // BigInt.fromString("1")
      const ALLOWED_METHODS = [
        "fromString",
        "fromHexString",
        "replace",
        "concat",
        "fromUTF8",
        "readValue",
        "undefined",
        // these are for logs (note, debug is not allowed in master)
        "info",
        "warning",
        "error",
        "critical",
      ];

      const callExpressionAncestor = ancestors.find(
        (ancestor) => ancestor.type === "CallExpression"
      );

      if (callExpressionAncestor) {
        const callee = callExpressionAncestor.callee;
        if (
          callee.type === "MemberExpression" &&
          // these may need to be expanded to include more methods
          ALLOWED_METHODS.includes(callee.property.name)
        ) {
          return false;
        }

        context.report({
          node: node,
          message: `'${logValue}' in '${
            callee.name ? callee.name : callee.object.name
          }()': String literal argument is only allowed in logs, please create a constant for this value.`,
        });
        return true;
      }
    }
    function checkVariableDeclarator(node, ancestors, logValue) {
      const variableDeclaratorAncestor = ancestors.find(
        (ancestor) => ancestor.type === "VariableDeclarator"
      );
      if (variableDeclaratorAncestor) {
        const variableName = variableDeclaratorAncestor.id.name;
        // check UPPER_CASE variable name
        const regex = /(\/([_A-Z]+[_-]*[A-Z]+)*)*$/;
        if (!regex.test(variableName)) {
          context.report({
            node: node,
            message: `'${logValue}' in variable '${variableName}': String literal variables need to use UPPER_CASE. If used in multiple files, it should live in constants.ts`,
          });
        }
      }
    }
    return {
      Literal: function (node) {
        const regex = /^[^\w]+$/; // allow non-word string literals (e.g. "-", "_")
        if (
          typeof node.value !== "string" ||
          regex.test(node.value) ||
          node.value === ""
        ) {
          return;
        }
        const ancestors = context.getAncestors();
        // if the string literal is a call argument, it must be log.error etc
        if (!checkLogCallOrStringMethods(node, ancestors, node.value)) {
          // if the string literal is used in variable declaration, variable name
          // must be in UPPER_CASE
          checkVariableDeclarator(node, ancestors, node.value);
        }
      },
      TemplateLiteral: function (node) {
        const regex = /^[^\w]+$/; // allow non-word string literals (e.g. "-", "_")
        const ancestors = context.getAncestors();
        node.quasis.forEach((quasi) => {
          const rawValue = quasi.value.raw;
          if (rawValue.length > 0 && !regex.test(rawValue)) {
            // if the string literal is a call argument, it must be log.error etc
            if (!checkLogCallOrStringMethods(node, ancestors, rawValue)) {
              // if the string literal is used in variable declaration, variable name
              // must be in UPPER_CASE
              checkVariableDeclarator(node, ancestors, rawValue);
            }
          }
        });
      },
    };
  },
};
