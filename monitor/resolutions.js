import { errorNotification, fetchMessages, sendDiscordMessage, startProtocolThread } from "./messageDiscord.js";
import { sleep } from "./util.js";

export async function pullMessagesByThread(channelIdList, channelToProtocolIss, channelToIndexIssuesMapping) {
    const channelToProtocolIssuesMapping = JSON.parse(JSON.stringify(channelToProtocolIss));
    const channelIdsListCopy = JSON.parse(JSON.stringify([...channelIdList]));

    const useQueries = channelIdsListCopy.slice(0, 5);
    const newQueriesArray = [...channelIdsListCopy.slice(5)];
    try {
        const fetchMessagesPromiseArr = useQueries.map(channelId => {
            return fetchMessages("", channelId);
        });
        const promiseSettle = await Promise.allSettled(fetchMessagesPromiseArr);
        promiseSettle.forEach((res) => {
            if (res?.value?.length > 0) {
                res.value.forEach((protocolMessageObject) => {
                    const networkList = Object.keys(channelToProtocolIssuesMapping[protocolMessageObject.channel_id] || []);
                    if (networkList.length === 0) {
                        return;
                    }
                    networkList.forEach(chain => {
                        const chainStr = chain.split('-pending')[0];
                        const isPending = chain.split('-pending').length > 1;

                        const embedObjectOnChain = protocolMessageObject.embeds.find(x => x.title.includes(chainStr) && x.title.toUpperCase().includes("PROTOCOL LEVEL ERRORS") && ((x.title.toUpperCase().includes("PENDING") && isPending) || (!x.title.toUpperCase().includes("PENDING") && !isPending)));
                        if (!embedObjectOnChain) {
                            return;
                        }
                        let fieldCells = embedObjectOnChain.fields.filter(cell => cell.name === "Field").map(x => x.value);
                        if (fieldCells) {
                            const existingFields = channelToProtocolIssuesMapping[protocolMessageObject.channel_id][chainStr];
                            fieldCells = [...existingFields, ...fieldCells.filter(x => !existingFields.includes(x))];
                            channelToProtocolIssuesMapping[protocolMessageObject.channel_id][chainStr] = fieldCells;
                        }
                    });

                    if (!channelToIndexIssuesMapping[protocolMessageObject.channel_id]) {
                        channelToIndexIssuesMapping[protocolMessageObject.channel_id] = [];
                    }
                    // This checks all of the embeds within this message. Other messages in this protocol thread could have embeds with the same title/category
                    const indexingErrorObject = protocolMessageObject.embeds.find(x => x.title.toUpperCase().includes("INDEXING ERRORS"));
                    if (!indexingErrorObject) {
                        return;
                    }
                    const chainLine = indexingErrorObject.fields.find(x => x.name === "Chain")?.value;
                    if (!chainLine) {
                        return;
                    }
                    const indexedLine = indexingErrorObject.fields.find(x => x.name === "Failed At Block")?.value;
                    if (!indexedLine) {
                        return;
                    }
                    const linesByChainArr = chainLine.split('\n').join('-----').split('-----');
                    const linesByIndexedArr = indexedLine.split('\n').join('-----').split('-----');
                    linesByChainArr.forEach((line, idx) => {
                        channelToIndexIssuesMapping[protocolMessageObject.channel_id].push({ chain: line, indexed: linesByIndexedArr[idx], timestamp: protocolMessageObject.timestamp });
                    })
                });
            }
        });
    } catch (err) {
        errorNotification("ERROR LOCATION 18 " + err.message);
    }

    await sleep(5000);
    if (newQueriesArray.length > 0) {
        return pullMessagesByThread(newQueriesArray, channelToProtocolIssuesMapping, channelToIndexIssuesMapping);
    }

    return { channelToProtocolIssuesMapping, channelToIndexIssuesMapping };
}

let reqCount = 0;
export async function resolveThreadCreation(protocols, threadsCreated, protocolNameToBaseMapping) {
    const threadsCreatedCopy = { ...threadsCreated };
    let useQueries = [...protocols];
    useQueries = useQueries.slice(0, 5);
    const newQueriesArray = [...protocols.slice(5)];
    try {
        const promiseSettle = await Promise.allSettled(useQueries.map(object => {
            const base = protocolNameToBaseMapping[object.protocolName];
            reqCount += 1;
            return startProtocolThread(object.protocolName, base);
        }));
        promiseSettle.forEach(res => {
            if (res?.value) {
                threadsCreatedCopy[res?.value?.protocolName] = res?.value?.channel;
            }
        })
    } catch (err) {
        errorNotification("ERROR LOCATION 19 " + err.message);
    }

    if (reqCount >= 45) {
        return threadsCreatedCopy;
    }
    await sleep(5000);
    if (newQueriesArray.length > 0) {
        return resolveThreadCreation(newQueriesArray, threadsCreatedCopy, protocolNameToBaseMapping);
    }
    return threadsCreatedCopy;
}

export async function resolveQueriesToAttempt(queriesToAttempt) {
    // Take the first 5 queries to attempt
    let useQueries = queriesToAttempt.slice(0, 5);
    const newQueriesArray = [...queriesToAttempt.slice(5)];
    try {
        await Promise.allSettled(useQueries.map(object => sendDiscordMessage(object.message, object.protocolName, object.channel)));
    } catch (err) {
        errorNotification("ERROR LOCATION 20 " + err.message);
    }
    await sleep(5000);
    if (newQueriesArray.length > 0) {
        return resolveQueriesToAttempt(newQueriesArray);
    }
    return;
}
