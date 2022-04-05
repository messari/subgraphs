const Web3 = require("web3");
const assert = require("assert");

const NODE_URL = "https://mainnet.infura.io/v3/eab64cc6778f4435b0e94c4b10d78da6";

const POOL_TOKEN_ADDRESS  = "0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533";
const FIRST_BLOCK_NUMBER  = 9009426;
const LIQUIDITY_EVENT_ABI = {"anonymous":false,"inputs":[{"indexed":true,"name":"_provider","type":"address"},{"indexed":true,"name":"_reserveToken","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"},{"indexed":false,"name":"_newBalance","type":"uint256"},{"indexed":false,"name":"_newSupply","type":"uint256"}],"name":"LiquidityAdded","type":"event"};
const OWNER_UPDATE_EVENT  = Web3.utils.keccak256("OwnerUpdate(address,address)");

async function rpc(promise) {
    while (true) {
        try {
            return await promise;
        }
        catch (error) {
            console.log(error.message);
            if (error.message.endsWith("project ID request rate exceeded")) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }
            else if (!error.message.startsWith("Invalid JSON RPC response")) {
                throw error;
            }
        }
    }
}

function parseOwnerUpdateEvent(log) {
    const indexed = log.topics.length > 1;
    return {
        blockNumber: log.blockNumber,
        prevOwner: Web3.utils.toChecksumAddress(indexed ? log.topics[1].slice(-40) : log.data.slice(26, 66)),
        currOwner: Web3.utils.toChecksumAddress(indexed ? log.topics[2].slice(-40) : log.data.slice(90, 130))
    };
}

async function getPastLogs(web3, address, topics, fromBlock, toBlock) {
    if (fromBlock <= toBlock) {
        try {
            const arr = await rpc(web3.eth.getPastLogs({address, topics, fromBlock, toBlock}));
            assert(Array.isArray(arr));
            return arr;
        }
        catch (error) {
            const midBlock = (fromBlock + toBlock) >> 1;
            const arr1 = await getPastLogs(web3, address, topics, fromBlock, midBlock);
            const arr2 = await getPastLogs(web3, address, topics, midBlock + 1, toBlock);
            return [...arr1, ...arr2];
        }
    }
    return [];
}

async function getPastEvents(contract, eventName, fromBlock, toBlock, filter) {
    if (fromBlock <= toBlock) {
        try {
            const arr = await rpc(contract.getPastEvents(eventName, {fromBlock, toBlock, filter}));
            assert(Array.isArray(arr));
            return arr;
        }
        catch (error) {
            const midBlock = (fromBlock + toBlock) >> 1;
            const arr1 = await getPastEvents(contract, eventName, fromBlock, midBlock, filter);
            const arr2 = await getPastEvents(contract, eventName, midBlock + 1, toBlock, filter);
            return [...arr1, ...arr2];
        }
    }
    return [];
}

async function getOwnerUpdateEvents(web3, address, fromBlock, toBlock) {
    const logs = await getPastLogs(web3, address, [OWNER_UPDATE_EVENT], fromBlock, toBlock);
    if (logs.length > 0)
        return logs.map(log => parseOwnerUpdateEvent(log));
    const prelogs = await getPastLogs(web3, address, [OWNER_UPDATE_EVENT], FIRST_BLOCK_NUMBER, fromBlock - 1);
    if (prelogs.length > 0)
        return [parseOwnerUpdateEvent(prelogs[prelogs.length - 1])];
    throw new Error("No Owner");
}

async function getBatches(web3, address, fromBlock, toBlock) {
    const batches = [{fromBlock: fromBlock, toBlock: undefined, owner: undefined}];
    const events = await getOwnerUpdateEvents(web3, address, fromBlock, toBlock);
    for (const event of events.filter(event => event.blockNumber > fromBlock)) {
        batches[batches.length - 1].toBlock = event.blockNumber - 1;
        batches[batches.length - 1].owner = event.prevOwner;
        batches.push({fromBlock: event.blockNumber, toBlock: undefined, owner: undefined});
    }
    batches[batches.length - 1].toBlock = toBlock;
    batches[batches.length - 1].owner = events[events.length - 1].currOwner;
    return batches;
}

async function run() {
    const web3 = new Web3(NODE_URL);

    const lastBlockNumber = await rpc(web3.eth.getBlockNumber());

    for (const batch of await getBatches(web3, POOL_TOKEN_ADDRESS, FIRST_BLOCK_NUMBER, lastBlockNumber)) {
        const converter = new web3.eth.Contract([LIQUIDITY_EVENT_ABI], batch.owner);
        for (const event of await getPastEvents(converter, LIQUIDITY_EVENT_ABI.name, batch.fromBlock, batch.toBlock)) {
            console.log('Converter address:', converter._address, 'Transaction hash:', event.transactionHash);
        }
    }

    if (web3.currentProvider.disconnect)
        web3.currentProvider.disconnect();
}

run();