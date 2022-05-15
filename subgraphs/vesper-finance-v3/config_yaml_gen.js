const { controllers, pools, tokens } = require("vesper-metadata");
const { readFile, writeFile } = require("fs-extra");
const Mustache = require("mustache");
const _ = require("lodash");

const genFunc = () => {
  console.info("Config generation started");
  const context = {
    controllers: _.filter(controllers, { chainId: 1 }).map((e) => ({
      name: e.name,
      address: e.address,
    })),
    tokens: _.filter(tokens, { chainId: 1 }).map((e) => ({
      name: e.symbol,
      address: e.address,
    })),
    pools: _.filter(pools, (e) => {
      return e.chainId === 1 && ["prod", "orbit"].indexOf(e.stage) > -1 && e.version > 2;
    }).map((e) => {
      let version = 0;

      if (!e.version) {
        version = 2;
      } else {
        version = e.version < 3 ? 2 : 3;
      }

      return {
        name: `${e.name}_${e.stage}_RL${e.riskLevel}`,
        address: e.address,
        version,
        birthblock: e.birthblock,
      };
    }),
  };

  console.info("Template context :", context);
  readFile("./subgraph.template.yaml", "utf8")
    .then((templateFile) =>
      writeFile("./subgraph.yaml", Mustache.render(templateFile, context))
    )
    .then(() => {
      console.info("Config generation done");
    });
};

genFunc();
