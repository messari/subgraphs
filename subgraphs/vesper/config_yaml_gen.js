const { controllers, pools, tokens } = require("vesper-metadata");
const { readFile, writeFile } = require("fs-extra");
const Mustache = require("mustache");
const _ = require("lodash");

const genFunc = () => {
  console.info("Config generation started");
  const context = {
    controllers: [],
  };

  controllers.forEach((e) => {
    if (e.chainId === 1) {
      context.controllers.push({ name: e.name, address: e.address });
    }
  });

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
