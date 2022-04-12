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
        e.chainId === 1 && e.stage === "prod" && e.version > 2 && e.version < 4 // When next abi version arrives increment
      );
    }).map((e) => ({
      name: e.name,
      address: e.address,
      version: e.version,
      birthblock: e.birthblock,
    })),
  };

  context.pools = [
    {
      name: "vaUSDC",
      address: "0xa8b607Aa09B6A2E306F93e74c282Fb13f6A80452",
      version: 3,
      birthblock: 13729330,
    },
    {
      name: "vaETH",
      address: "0xd1C117319B3595fbc39b471AB1fd485629eb05F2",
      version: 3,
      birthblock: 13044797,
    },
  ];

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
