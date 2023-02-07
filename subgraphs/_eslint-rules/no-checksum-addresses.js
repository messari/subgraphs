
var ethereum_address = require('ethereum-address');

module.exports = {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Enforce ethereum addresses to be lowercase to prevent string comparison errors',
        },
    },
    create: function (context) {
        return {
            Literal: function (node) {
                if (ethereum_address.isAddress(node.value) && node.value !== node.value.toLowerCase()) {
                    context.report({
                        node: node,
                        message: 'Ethereum addresses should be lowercase',
                        fix: function (fixer) {
                            return fixer.replaceText(node, node.raw.toLowerCase());
                        },
                    });
                }
            },
        };
    }
}
