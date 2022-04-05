const Web3 = require("web3");

const INFURA_PROJECT_ID = 'eab64cc6778f4435b0e94c4b10d78da6'
const NODE_URL = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;

const CONTRACT_REGISTRY_ADDRESS = '0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4'
const CONTRACT_REGISTRY_ABI = [{"constant":true,"inputs":[],"name":"BANCOR_CONVERTER_UPGRADER","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BNT_TOKEN","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_contractName","type":"bytes32"}],"name":"getAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"CONTRACT_REGISTRY","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_contractName","type":"bytes32"}],"name":"unregisterAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"contractNames","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BANCOR_CONVERTER_FACTORY","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BNT_CONVERTER","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_contractName","type":"bytes32"},{"name":"_contractAddress","type":"address"}],"name":"registerAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"itemCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BANCOR_FORMULA","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"CONTRACT_FEATURES","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BANCOR_NETWORK","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BANCOR_GAS_PRICE_LIMIT","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_contractName","type":"bytes32"}],"name":"addressOf","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"BANCOR_X","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_contractName","type":"bytes32"},{"indexed":false,"name":"_contractAddress","type":"address"}],"name":"AddressUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_prevOwner","type":"address"},{"indexed":true,"name":"_newOwner","type":"address"}],"name":"OwnerUpdate","type":"event"}]
const CONVERTER_REGISTRY = "BancorConverterRegistry"

async function run() {
    const web3 = new Web3(NODE_URL);
    const contractName = web3.utils.padRight(web3.utils.toHex(CONVERTER_REGISTRY), 64)
    
    const contractRegistry = new web3.eth.Contract(CONTRACT_REGISTRY_ABI, CONTRACT_REGISTRY_ADDRESS)
    contractRegistry.getPastEvents('AddressUpdate', {
        filter: {
            _contractName: contractName,
        },
        fromBlock: 6563025 // start block of ContractRegistry
    }).then(function (events) {
        events.forEach((event) => {
            console.log({
                transactionHash: event.transactionHash,
                contractAddress: event.returnValues._contractAddress
            })
        })
    })
}

run()