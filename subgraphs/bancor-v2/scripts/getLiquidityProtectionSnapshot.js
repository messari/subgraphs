const fs = require("fs");
const os = require("os");
const Web3 = require("web3");
const assert = require("assert");
const Decimal = require("decimal.js");

Decimal.set({precision: 100, rounding: Decimal.ROUND_DOWN});

const NODE_ADDRESS = "Your Ethereum Node URL";

const GENERAL_INFO_FILE_NAME = "general.info.csv";
const PROTECTION_FILE_NAME   = "protection.csv";
const REWARDING_FILE_NAME    = "rewarding.csv";
const TRANSFER_FILE_NAME     = "transfer.csv";

const GENESIS_BLOCK_NUMBER  =  3851136;
const LP_STORE_BLOCK_NUMBER = 11039642;
const SR_STORE_BLOCK_NUMBER = 11693026;

const SETTINGS_ABI = [
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IConverterAnchor","name":"poolAnchor","type":"address"},{"indexed":false,"internalType":"bool","name":"added","type":"bool"}],"name":"PoolWhitelistUpdated","type":"event"},
];

const TOKEN_ABI = [
    {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},
];

const CONVERTER_ABI = [
    {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"connectorTokens","outputs":[{"internalType":"contract IERC20Token","name":"","type":"address"}],"stateMutability":"view","type":"function"},
];

const CONVERSION_EVENT_ABIS = [
    {"anonymous":false,"inputs":[{"indexed":true,"name":"sourceToken","type":"address"},{"indexed":true,"name":"targetToken","type":"address"},{"indexed":true,"name":"trader","type":"address"},{"indexed":false,"name":"sourceAmount","type":"uint256"},{"indexed":false,"name":"targetAmount","type":"uint256"}],"name":"Change","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"sourceToken","type":"address"},{"indexed":true,"name":"targetToken","type":"address"},{"indexed":true,"name":"trader","type":"address"},{"indexed":false,"name":"sourceAmount","type":"uint256"},{"indexed":false,"name":"targetAmount","type":"uint256"},{"indexed":false,"name":"_currentPriceN","type":"uint256"},{"indexed":false,"name":"_currentPriceD","type":"uint256"}],"name":"Conversion","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"sourceToken","type":"address"},{"indexed":true,"name":"targetToken","type":"address"},{"indexed":true,"name":"trader","type":"address"},{"indexed":false,"name":"sourceAmount","type":"uint256"},{"indexed":false,"name":"targetAmount","type":"uint256"},{"indexed":false,"name":"conversionFee","type":"int256"}],"name":"Conversion","type":"event"},
];

const LIQUIDITY_EVENT_ABIS = [
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_provider","type":"address"},{"indexed":true,"name":"_reserveToken","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"},{"indexed":false,"name":"_newBalance","type":"uint256"},{"indexed":false,"name":"_newSupply","type":"uint256"}],"name":"LiquidityAdded","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_provider","type":"address"},{"indexed":true,"name":"_reserveToken","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"},{"indexed":false,"name":"_newBalance","type":"uint256"},{"indexed":false,"name":"_newSupply","type":"uint256"}],"name":"LiquidityRemoved","type":"event"},
];

const PROTECTION_EVENT_ABIS = [
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_provider","type":"address"},{"indexed":true,"name":"_poolToken","type":"address"},{"indexed":true,"name":"_reserveToken","type":"address"},{"indexed":false,"name":"_poolAmount","type":"uint256"},{"indexed":false,"name":"_reserveAmount","type":"uint256"}],"name":"ProtectionAdded","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_provider","type":"address"},{"indexed":true,"name":"_poolToken","type":"address"},{"indexed":true,"name":"_reserveToken","type":"address"},{"indexed":false,"name":"_poolAmount","type":"uint256"},{"indexed":false,"name":"_reserveAmount","type":"uint256"}],"name":"ProtectionRemoved","type":"event"},
];

const REWARDING_EVENT_ABIS = [
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"provider","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardsClaimed","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"provider","type":"address"},{"indexed":true,"internalType":"contractIDSToken","name":"poolToken","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"newId","type":"uint256"}],"name":"RewardsStaked","type":"event"},
];

const ROLE_EVENT_ABIS = [
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},
];

const TRANSFER_TYPES = [
    {name: "Mint", filter: "_from", account: "_to"},
    {name: "Burn", filter: "_to", account: "_from"},
];

const LP_STORE_ADDRESS    = "0xf5FAB5DBD2f3bf675dE4cB76517d4767013cfB55";
const SETTINGS_ADDRESS    = "0xF7D28FaA1FE9Ea53279fE6e3Cde75175859bdF46";
const SR_STORE_ADDRESS    = "0x891AfF26593Da95e574E3f62619dAD6624FB5693";
const BNT_TOKEN_ADDRESS   = "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C";
const ETH_RESERVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const INVALID_ANCHORS = ["0xa0246c9032bC3A600820415aE600c6388619A14D", "0xE5CAeF4Af8780E59Df925470b050Fb23C43CA68C"];

const OWNER_UPDATE_EVENT_HASH = Web3.utils.keccak256("OwnerUpdate(address,address)");
const OWNER_ROLE_STRING_HASH  = Web3.utils.keccak256("ROLE_OWNER");

function printRow(fileName, ...cellValues) {
    const row = cellValues.map(value => String(value).trim()).join(",") + os.EOL;
    fs.appendFileSync(fileName, row, {encoding: "utf8"});
    process.stdout.write(row);
}

function toDecimal(amount, decimals) {
    return Decimal(`${amount}e-${decimals}`).toFixed();
}

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

async function call(method) {
    return await rpc(method.call());
}

async function getSymbol(token) {
    if (token._address != ETH_RESERVE_ADDRESS) {
        try {
            return await call(token.methods.symbol());
        }
        catch (error) {
            return "???";
        }
    }
    return "ETH";
}

async function getDecimals(token) {
    if (token._address != ETH_RESERVE_ADDRESS) {
        try {
            return await call(token.methods.decimals());
        }
        catch (error) {
            return "0";
        }
    }
    return "18";
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
    const logs = await getPastLogs(web3, address, [OWNER_UPDATE_EVENT_HASH], fromBlock, toBlock);
    if (logs.length > 0)
        return logs.map(log => parseOwnerUpdateEvent(log));
    const prelogs = await getPastLogs(web3, address, [OWNER_UPDATE_EVENT_HASH], GENESIS_BLOCK_NUMBER, fromBlock - 1);
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

async function getOwnerContracts(web3, address, fromBlock, toBlock) {
    const batches = [];
    const contract = new web3.eth.Contract(ROLE_EVENT_ABIS, address);
    const roleGrantedEvents = await getPastEvents(contract, "RoleGranted", fromBlock, toBlock, {role: OWNER_ROLE_STRING_HASH});
    const roleRevokedEvents = await getPastEvents(contract, "RoleRevoked", fromBlock, toBlock, {role: OWNER_ROLE_STRING_HASH});
    for (let i = 0; i < roleGrantedEvents.length; i++) {
        batches[i] = {
            fromBlock: roleGrantedEvents[i].blockNumber,
            toBlock  : toBlock,
            owner    : roleGrantedEvents[i].returnValues.account
        };
        for (let j = 0; j < roleRevokedEvents.length; j++) {
            if (roleGrantedEvents[i].returnValues.account == roleRevokedEvents[j].returnValues.account) {
                batches[i].toBlock = roleRevokedEvents[j].blockNumber;
            }
            break;
        };
    }
    assert(batches.every(batch => batch.fromBlock <= batch.toBlock));
    return batches;
}

async function getPoolAnchors(web3, fromBlock, toBlock) {
    const contract = new web3.eth.Contract(SETTINGS_ABI, SETTINGS_ADDRESS);
    const events = await getPastEvents(contract, "PoolWhitelistUpdated", fromBlock, toBlock);
    return [...new Set(events.map(event => event.returnValues.poolAnchor))].filter(anchor => !INVALID_ANCHORS.includes(anchor));
}

async function getConversionEvents(web3, address, fromBlock, toBlock, symbols, decimals) {
    const conversionEvents = [];

    let index = 0;
    for (const batch of await getBatches(web3, address, fromBlock, toBlock)) {
        for (const abi of CONVERSION_EVENT_ABIS.slice(index)) {
            const converter = new web3.eth.Contract([abi], batch.owner);
            const events = await getPastEvents(converter, abi.name, batch.fromBlock, batch.toBlock);
            if (events.length > 0) {
                for (const event of events) {
                    conversionEvents.push({
                        blockNumber     : event.blockNumber,
                        transactionHash : event.transactionHash,
                        transactionIndex: event.transactionIndex,
                        sourceToken     : symbols[event.returnValues.sourceToken],
                        targetToken     : symbols[event.returnValues.targetToken],
                        sourceAmount    : toDecimal(event.returnValues.sourceAmount , decimals[event.returnValues.sourceToken]),
                        targetAmount    : toDecimal(event.returnValues.targetAmount , decimals[event.returnValues.targetToken]),
                        conversionFee   : toDecimal(event.returnValues.conversionFee, decimals[event.returnValues.targetToken]),
                        trader          : event.returnValues.trader,
                    });
                }
                index = CONVERSION_EVENT_ABIS.indexOf(abi);
                break;
            }
        }
    }

    return conversionEvents;
}

async function getLiquidityEvents(web3, address, fromBlock, toBlock, symbols, decimals) {
    const liquidityEvents = [];

    for (const batch of await getBatches(web3, address, fromBlock, toBlock)) {
        for (const abi of LIQUIDITY_EVENT_ABIS) {
            const converter = new web3.eth.Contract([abi], batch.owner);
            for (const event of await getPastEvents(converter, abi.name, batch.fromBlock, batch.toBlock)) {
                liquidityEvents.push({
                    name            : abi.name,
                    blockNumber     : event.blockNumber,
                    transactionHash : event.transactionHash,
                    transactionIndex: event.transactionIndex,
                    provider        : event.returnValues._provider,
                    reserveToken    : symbols[event.returnValues._reserveToken],
                    reserveAmount   : toDecimal(event.returnValues._amount    , decimals[event.returnValues._reserveToken]),
                    reserveBalance  : toDecimal(event.returnValues._newBalance, decimals[event.returnValues._reserveToken]),
                    poolSupply      : toDecimal(event.returnValues._newSupply , 18),
                });
            }
        }
    }

    return liquidityEvents;
}

async function getProtectionEvents(web3, address, fromBlock, toBlock, symbols, decimals) {
    const protectionEvents = [];

    for (const abi of PROTECTION_EVENT_ABIS) {
        const store = new web3.eth.Contract([abi], address);
        for (const event of await getPastEvents(store, abi.name, fromBlock, toBlock)) {
            protectionEvents.push({
                name            : abi.name,
                blockNumber     : event.blockNumber,
                transactionHash : event.transactionHash,
                transactionIndex: event.transactionIndex,
                provider        : event.returnValues._provider,
                poolToken       : symbols[event.returnValues._poolToken   ],
                reserveToken    : symbols[event.returnValues._reserveToken],
                poolAmount      : toDecimal(event.returnValues._poolAmount   , 18),
                reserveAmount   : toDecimal(event.returnValues._reserveAmount, decimals[event.returnValues._reserveToken]),
            });
        }
    }

    return protectionEvents;
}

async function getRewardingEvents(web3, address, fromBlock, toBlock, symbols) {
    const rewardingEvents = [];

    for (const batch of await getOwnerContracts(web3, address, fromBlock, toBlock)) {
        for (const abi of REWARDING_EVENT_ABIS) {
            const rewarding = new web3.eth.Contract([abi], batch.owner);
            for (const event of await getPastEvents(rewarding, abi.name, batch.fromBlock, batch.toBlock)) {
                rewardingEvents.push({
                    name            : abi.name,
                    blockNumber     : event.blockNumber,
                    transactionHash : event.transactionHash,
                    transactionIndex: event.transactionIndex,
                    provider        : event.returnValues.provider,
                    poolToken       : symbols[event.returnValues.poolToken],
                    amount          : toDecimal(event.returnValues.amount, 18),
                    newId           : event.returnValues.newId,
                });
            }
        }
    }

    return rewardingEvents;
}

async function getTransferEvents(web3, address, fromBlock, toBlock) {
    const transferEvents = [];

    const token = new web3.eth.Contract(TOKEN_ABI, address);
    for (const transferType of TRANSFER_TYPES) {
        for (const event of await getPastEvents(token, "Transfer", fromBlock, toBlock, {[transferType.filter]: BNT_TOKEN_ADDRESS})) {
            transferEvents.push({
                name            : transferType.name,
                blockNumber     : event.blockNumber,
                transactionHash : event.transactionHash,
                transactionIndex: event.transactionIndex,
                account         : event.returnValues[transferType.account],
                amount          : toDecimal(event.returnValues._value, 18),
            });
        }
    }

    return transferEvents;
}

async function fetchGeneralInfo(web3, latestBlockNumber) {
    const poolAnchors = await getPoolAnchors(web3, LP_STORE_BLOCK_NUMBER, latestBlockNumber);
    const poolTokens = poolAnchors.map(poolAnchor => new web3.eth.Contract(TOKEN_ABI, poolAnchor));
    const poolTokenOwners = await Promise.all(poolTokens.map(token => call(token.methods.owner())));
    const poolTokenSymbols = await Promise.all(poolTokens.map(token => call(token.methods.symbol())));

    const poolConverters = poolTokenOwners.map(address => new web3.eth.Contract(CONVERTER_ABI, address));
    const poolReserve0Addresses = await Promise.all(poolConverters.map(converter => call(converter.methods.connectorTokens(0))));
    const poolReserve1Addresses = await Promise.all(poolConverters.map(converter => call(converter.methods.connectorTokens(1))));

    const poolReserveAddresses = [];
    for (let i = 0; i < poolAnchors.length; i++) {
        poolReserveAddress = [poolReserve0Addresses[i], poolReserve1Addresses[i]].filter(address => address != BNT_TOKEN_ADDRESS);
        if (poolReserveAddress.length != 1)
            throw new Error(`illegal pool at ${poolConverters[i]._address}`);
        poolReserveAddresses.push(poolReserveAddress[0]);
    }

    const poolReserveTokens = poolReserveAddresses.map(address => new web3.eth.Contract(TOKEN_ABI, address));
    const poolReserveTokenSymbols = await Promise.all(poolReserveTokens.map(token => getSymbol(token)));
    const poolReserveTokenDecimals = await Promise.all(poolReserveTokens.map(token => getDecimals(token)));

    fs.writeFileSync(GENERAL_INFO_FILE_NAME, "", {encoding: "utf8"});

    printRow(
        GENERAL_INFO_FILE_NAME,
        "pool anchor     ",
        "pool symbol     ",
        "reserve address ",
        "reserve symbol  ",
        "reserve decimals",
    );

    for (let i = 0; i < poolAnchors.length; i++) {
        printRow(
            GENERAL_INFO_FILE_NAME,
            poolAnchors             [i],
            poolTokenSymbols        [i],
            poolReserveAddresses    [i],
            poolReserveTokenSymbols [i],
            poolReserveTokenDecimals[i],
        );
    }
}

async function fetchConversionEvents(web3, latestBlockNumber) {
    for (const line of fs.readFileSync(GENERAL_INFO_FILE_NAME, {encoding: "utf8"}).split(os.EOL).slice(1, -1)) {
        const words = line.split(",");
        const poolTokenAddress         = words[0];
        const poolTokenSymbol          = words[1];
        const poolReserveAddress       = words[2];
        const poolReserveSymbol        = words[3];
        const poolReserveTokenDecimals = words[4];

        const symbols = {
            [BNT_TOKEN_ADDRESS ]: "BNT",
            [poolReserveAddress]: poolReserveSymbol
        };

        const decimals = {
            [BNT_TOKEN_ADDRESS ]: "18",
            [poolReserveAddress]: poolReserveTokenDecimals
        };

        const fileName = poolTokenSymbol.split("/").join("-") + ".conversion.csv";
        fs.writeFileSync(fileName, "", {encoding: "utf8"});

        printRow(
            fileName,
            "blockNumber     ",
            "transactionHash ",
            "transactionIndex",
            "sourceToken     ",
            "targetToken     ",
            "sourceAmount    ",
            "targetAmount    ",
            "conversionFee   ",
            "trader          ",
        );

        for (const conversionEvent of await getConversionEvents(web3, poolTokenAddress, LP_STORE_BLOCK_NUMBER, latestBlockNumber, symbols, decimals)) {
            printRow(
                fileName,
                conversionEvent.blockNumber     ,
                conversionEvent.transactionHash ,
                conversionEvent.transactionIndex,
                conversionEvent.sourceToken     ,
                conversionEvent.targetToken     ,
                conversionEvent.sourceAmount    ,
                conversionEvent.targetAmount    ,
                conversionEvent.conversionFee   ,
                conversionEvent.trader          ,
            );
        }
    }
}

async function fetchLiquidityEvents(web3, latestBlockNumber) {
    for (const line of fs.readFileSync(GENERAL_INFO_FILE_NAME, {encoding: "utf8"}).split(os.EOL).slice(1, -1)) {
        const words = line.split(",");
        const poolTokenAddress         = words[0];
        const poolTokenSymbol          = words[1];
        const poolReserveAddress       = words[2];
        const poolReserveSymbol        = words[3];
        const poolReserveTokenDecimals = words[4];

        const symbols = {
            [BNT_TOKEN_ADDRESS ]: "BNT",
            [poolReserveAddress]: poolReserveSymbol
        };

        const decimals = {
            [BNT_TOKEN_ADDRESS ]: "18",
            [poolReserveAddress]: poolReserveTokenDecimals
        };

        const fileName = poolTokenSymbol.split("/").join("-") + ".liquidity.csv";
        fs.writeFileSync(fileName, "", {encoding: "utf8"});

        printRow(
            fileName,
            "name            ",
            "blockNumber     ",
            "transactionHash ",
            "transactionIndex",
            "provider        ",
            "reserveToken    ",
            "reserveAmount   ",
            "reserveBalance  ",
            "poolSupply      ",
        );

        for (const liquidityEvent of await getLiquidityEvents(web3, poolTokenAddress, LP_STORE_BLOCK_NUMBER, latestBlockNumber, symbols, decimals)) {
            printRow(
                fileName,
                liquidityEvent.name            ,
                liquidityEvent.blockNumber     ,
                liquidityEvent.transactionHash ,
                liquidityEvent.transactionIndex,
                liquidityEvent.provider        ,
                liquidityEvent.reserveToken    ,
                liquidityEvent.reserveAmount   ,
                liquidityEvent.reserveBalance  ,
                liquidityEvent.poolSupply      ,
            );
        }
    }
}

async function fetchProtectionEvents(web3, latestBlockNumber) {
    const symbols  = {[BNT_TOKEN_ADDRESS]: "BNT"};
    const decimals = {[BNT_TOKEN_ADDRESS]: "18" };

    for (const line of fs.readFileSync(GENERAL_INFO_FILE_NAME, {encoding: "utf8"}).split(os.EOL).slice(1, -1)) {
        const words = line.split(",");
        const poolTokenAddress         = words[0];
        const poolTokenSymbol          = words[1];
        const poolReserveAddress       = words[2];
        const poolReserveSymbol        = words[3];
        const poolReserveTokenDecimals = words[4];
        symbols [poolTokenAddress  ] = poolTokenSymbol;
        symbols [poolReserveAddress] = poolReserveSymbol;
        decimals[poolReserveAddress] = poolReserveTokenDecimals;
    }

    fs.writeFileSync(PROTECTION_FILE_NAME, "", {encoding: "utf8"});

    printRow(
        PROTECTION_FILE_NAME,
        "name            ",
        "blockNumber     ",
        "transactionHash ",
        "transactionIndex",
        "provider        ",
        "poolToken       ",
        "reserveToken    ",
        "poolAmount      ",
        "reserveAmount   ",
    );

    for (const protectionEvent of await getProtectionEvents(web3, LP_STORE_ADDRESS, LP_STORE_BLOCK_NUMBER, latestBlockNumber, symbols, decimals)) {
        printRow(
            PROTECTION_FILE_NAME,
            protectionEvent.name            ,
            protectionEvent.blockNumber     ,
            protectionEvent.transactionHash ,
            protectionEvent.transactionIndex,
            protectionEvent.provider        ,
            protectionEvent.poolToken       ,
            protectionEvent.reserveToken    ,
            protectionEvent.poolAmount      ,
            protectionEvent.reserveAmount   ,
        );
    }
}

async function fetchRewardingEvents(web3, latestBlockNumber) {
    const symbols = {};

    for (const line of fs.readFileSync(GENERAL_INFO_FILE_NAME, {encoding: "utf8"}).split(os.EOL).slice(1, -1)) {
        const words = line.split(",");
        const poolTokenAddress = words[0];
        const poolTokenSymbol  = words[1];
        symbols[poolTokenAddress] = poolTokenSymbol;
    }

    fs.writeFileSync(REWARDING_FILE_NAME, "", {encoding: "utf8"});

    printRow(
        REWARDING_FILE_NAME,
        "name            ",
        "blockNumber     ",
        "transactionHash ",
        "transactionIndex",
        "provider        ",
        "poolToken       ",
        "amount          ",
        "newId           ",
    );

    for (const rewardingEvent of await getRewardingEvents(web3, SR_STORE_ADDRESS, SR_STORE_BLOCK_NUMBER, latestBlockNumber, symbols)) {
        printRow(
            REWARDING_FILE_NAME,
            rewardingEvent.name            ,
            rewardingEvent.blockNumber     ,
            rewardingEvent.transactionHash ,
            rewardingEvent.transactionIndex,
            rewardingEvent.provider        ,
            rewardingEvent.poolToken       ,
            rewardingEvent.amount          ,
            rewardingEvent.newId           ,
        );
    }
}

async function fetchTransferEvents(web3, latestBlockNumber) {
    fs.writeFileSync(TRANSFER_FILE_NAME, "", {encoding: "utf8"});

    printRow(
        TRANSFER_FILE_NAME,
        "name            ",
        "blockNumber     ",
        "transactionHash ",
        "transactionIndex",
        "account         ",
        "amount          ",
    );

    for (const transferEvent of await getTransferEvents(web3, BNT_TOKEN_ADDRESS, LP_STORE_BLOCK_NUMBER, latestBlockNumber)) {
        printRow(
            TRANSFER_FILE_NAME,
            transferEvent.name            ,
            transferEvent.blockNumber     ,
            transferEvent.transactionHash ,
            transferEvent.transactionIndex,
            transferEvent.account         ,
            transferEvent.amount          ,
        );
    }
}

function initFS(folderName) {
    fs.mkdirSync(folderName);
    const openSync = fs.openSync;
    fs.openSync = function(path, flags, mode) {
        const logged = {};
        while (true) {
            try {
                return openSync(folderName + "/" + path, flags, mode);
            }
            catch (error) {
                if (logged[error.message] == undefined) {
                    logged[error.message] = true;
                    console.log(error.message);
                }
            }
        }
    };
}

async function run() {
    const web3 = new Web3(NODE_ADDRESS);

    const latestBlockNumber = await rpc(web3.eth.getBlockNumber());

    initFS(process.argv[2] || String(latestBlockNumber));

    await fetchGeneralInfo     (web3, latestBlockNumber);
    await fetchConversionEvents(web3, latestBlockNumber);
    await fetchLiquidityEvents (web3, latestBlockNumber);
    await fetchProtectionEvents(web3, latestBlockNumber);
    await fetchRewardingEvents (web3, latestBlockNumber);
    await fetchTransferEvents  (web3, latestBlockNumber);

    if (web3.currentProvider.disconnect)
        web3.currentProvider.disconnect();
}

run();