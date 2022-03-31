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
      return (
        e.chainId === 1 && e.stage === "prod" && e.version === 3
      );
    }).map((e) => ({
      name: e.name,
      address: e.address,
      version: e.version,
      birthblock: e.birthblock,
    })),
  };

  console.log(context);
  readFile("./subgraph.template.yaml", "utf8")
    .then((templateFile) =>
      writeFile("./subgraph.yaml", Mustache.render(templateFile, context))
    )
    .then(() => {
      console.info("Config generation done");
    });
};

genFunc();
