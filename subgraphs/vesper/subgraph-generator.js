const pTap = require("p-tap");
const { pools } = require("vesper-metadata");
const {
  readFile,
  writeFile,
  rmdir,
  mkdir,
  pathExists,
  copy,
} = require("fs-extra");
const Mustache = require("mustache");
const { exec } = require("child_process");

const TypesFolder = "./types";
const GeneratedCodeFolder = "./generated";

const poolsToWatch = pools
  .filter((pool) => pool.chainId === 1 && pool.stage === "prod")
  .map(({ version = 2, address, name, birthblock }) => ({
    version,
    address,
    name,
    birthblock,
    interestFeeEvent:
      version === 2
        ? "Deposit(indexed address,uint256,uint256)"
        : "Transfer(indexed address,indexed address,uint256)",
  }));

function promisifyChildProcess(fn) {
  return function(...args) {
    const child = fn(...args);
    // forward the output of the child process to the parent one
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    return new Promise(function(resolve, reject) {
      child.addListener("error", reject);
      child.addListener("exit", resolve);
    });
  };
}

async function copyGeneratedFiles(pool) {
  if (!pool) {
    return;
  }
  const folderName = `${GeneratedCodeFolder}/poolV${pool.version}_${pool.name}_${pool.address}`;
  return copy(folderName, TypesFolder, { overwrite: true }).then(
    pTap(() => console.log(`Copied classes for V${pool.version} pools.`))
  );
}

// node-graph generates a class for each pool, but we just need a class for v2 and v3 pools (so far)
function cleanUpdatedFiles() {
  return pathExists(TypesFolder)
    .then(
      pTap((exists) =>
        console.log(`Types folder ${exists ? "" : "does not "}exists`)
      )
    )
    .then((exists) =>
      exists ? rmdir(TypesFolder, { recursive: true }) : Promise.resolve()
    )
    .then(pTap(() => console.log("Starting to run codegen.")))
    .then(() => promisifyChildProcess(exec)("npm run codegen"))
    .then(
      pTap(() =>
        console.log(
          "Generation of classes and schema succeded! Proceeding now to clean up the generated files."
        )
      )
    )
    .then(() => mkdir(TypesFolder))
    .then(pTap(() => console.log("Types folder created!")))
    .then(function() {
      // take a v2 pool, a v3pool, calculate the folder name and move the files into ./types
      const v2Pool = poolsToWatch.find(({ version }) => version === 2);
      const v3Pool = poolsToWatch.find(({ version }) => version === 3);
      return copyGeneratedFiles(v2Pool)
        .then(() => copyGeneratedFiles(v3Pool))
        .then(() =>
          copy(`${GeneratedCodeFolder}/schema.ts`, `${TypesFolder}/schema.ts`, {
            overwrite: true,
          })
        );
    })
    .then(() => rmdir(GeneratedCodeFolder, { recursive: true }));
}

console.log("Reading the template file");
readFile("./subgraph.template.yaml", "utf8")
  .then((templateFile) =>
    writeFile(
      "./subgraph.yaml",
      Mustache.render(templateFile, { pools: poolsToWatch })
    )
  )
  .then(pTap(() => console.log("subgraph.yaml generated successfully")))
  .then(cleanUpdatedFiles)
  .then(pTap(() => console.log("All file and code generation succeeded!")))
  .catch((e) => console.error(e));
