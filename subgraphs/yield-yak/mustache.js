var fs = require('fs');
const { argv } = require('process');
const Web3 = require('web3');

let numberOfBlocks = 250000;

if(argv.length >= 3 && !isNaN(argv[2])){
    numberOfBlocks = Number(argv[2]);
}
console.log(numberOfBlocks);

async function writeSubgraphYaml(){
    var web3 = new Web3('https://api.avax.network/ext/bc/C/rpc');
    var blockNumber = await web3.eth.getBlockNumber();
    console.log(blockNumber);
    var mustache = require('mustache');
    var jsonData = fs.readFileSync('./subgraph_data.json');
    var data = JSON.parse(jsonData);
    for(let i = 0; i< data.datasources.length; i++){
        data.datasources[i].startBlock = blockNumber - numberOfBlocks > data.datasources[i].startBlock ? blockNumber - numberOfBlocks : data.datasources[i].startBlock;
    }    
    var template = fs.readFileSync('subgraph.yaml.mustache','utf8');    
    var result = mustache.render(template, data);
    fs.writeFileSync('./subgraph.yaml', result);
}
writeSubgraphYaml();