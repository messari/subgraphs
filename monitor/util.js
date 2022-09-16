export const monitorVersion = "v1.0.4";

export const sleep = m => new Promise(r => setTimeout(r, m));

export const ProtocolTypeEntityName = {
    exchange: "dexAmmProtocol",
    exchanges: "dexAmmProtocol",
    lending: "lendingProtocol",
    yield: "yieldAggregator",
    yields: "yieldAggregator",
    vault: "yieldAggregator",
    vaults: "yieldAggregator",
    generic: "protocol",
};

export const formatIntToFixed2 = (val) => {
    let returnStr = parseFloat(val.toFixed(2)).toLocaleString();
    if (returnStr.split(".")[1]?.length === 1) {
        returnStr += "0";
    } else if (!returnStr.split(".")[1]?.length) {
        returnStr += ".00";
    }
    return returnStr;
};
