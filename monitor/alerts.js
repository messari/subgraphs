import { sendDiscordMessage } from "./messageDiscord.js";
import { poolErrorMessages, protocolErrorMessages } from "./errorSchemas.js";

export const alertFailedIndexing = async (discordMessages, deployments) => {
    // Get the indexing error message objects from the last week 
    const indexingErrorMessageObjs = discordMessages.filter(x => x.content.includes("**INDEXING ERRORS:**"));
    const indexingErrorDeposListStr = indexingErrorMessageObjs.map(msgObj => {
        return msgObj.content.split("LIST:")[1];
    });

    // For testing, loop through deployments and take the deployments which have an indexing error and construct a message
    const indexErrs = [];
    Object.keys(deployments).forEach(depo => {
        if (!!deployments[depo].indexingError && !indexingErrorDeposListStr.join('-').includes(depo) && indexErrs.join(" - ").length < 1400) {
            indexErrs.push(`Name: "${depo}", Indexed: ${deployments[depo].indexedPercentage}%, Endpoint: ${deployments[depo].url}`);
        }
    });

    const newIndexingErrorDiscordMessage = `
  **INDEXING ERRORS:**
      
  The following deployments have encountered errors indexing. Fatal Errors were detected and stopped execution. This list is of deployments that have stopped deployment as of the past 7 days or failed deployments that have not been alerted in the prior week. 
    
  LIST:
    
  ${indexErrs.join(",\n")}
    `;

    if (indexErrs.length > 0) {
        const sendIndexingErrorDiscord = await sendDiscordMessage(newIndexingErrorDiscordMessage);
    }
}

export const alertPoolLevelErrors = async (discordMessages, deployments, protocolType, queriesToAttempt) => {
    const promiseArr = [];
    Object.entries(deployments).forEach(([protocol, deployment]) => {
        const poolErrorMessage = discordMessages.find(x => {
            return x.content.includes("**POOL ERRORS") && x.content.includes(protocol.split('-').join(' '));
        });

        if (poolErrorMessage || deployment.protocolType !== protocolType) {
            return;
        }

        const protocolErrs = [];
        const newPoolErrorDiscordMessage = [`**POOL ERRORS: ${protocol.split('-').join(' ')}**\n`];
        Object.entries(deployment.poolErrors).forEach(([type, val]) => {
            if (val?.length > 0 && protocolErrs.join(" - ").length < 1500) {
                let list = val.join(",\n");
                if (val.length > 3) {
                    list = val.slice(0, 3).join(",\n") + ",\n";
                }
                newPoolErrorDiscordMessage.push(`
  Issue: ${type + (val.length > 3 ? ('-' + val.length + " pools with this error") : "")}
  ${poolErrorMessages[type]}
  
  Pools
  ${list}
  `);
            }
        });

        if (newPoolErrorDiscordMessage.length > 1) {
            const msgSendResult = sendDiscordMessage(newPoolErrorDiscordMessage.join(""));
            promiseArr.push(msgSendResult);
        }
    });
    // Turn requests into a promise array 
    await Promise.allSettled(promiseArr)
        .then(
            (response) => {
                response.forEach((res) => {
                    if (res?.reason?.response?.status === 429 && JSON.parse(res?.reason?.config?.data)?.content) {
                        queriesToAttempt.push(JSON.parse(res?.reason?.config?.data)?.content);
                    } else if (res?.value) {
                        queriesToAttempt.push(res.value);
                    }
                })
            }
        )
        .catch((err) => console.log(err, 'err'));
    return queriesToAttempt;
}

export const alertProtocolErrors = async (discordMessages, deployments, queriesToAttempt) => {
    const promiseArr = [];
    const protocolErrorMessageObjs = discordMessages.filter(x => x.content.includes("**PROTOCOL ERRORS:**"));
    const protocolErrorMsgs = protocolErrorMessageObjs.map(msgObj => {
        return msgObj.content.split("TYPE:")[1];
    })

    const alertedErrors = {
        totalValueLockedUSD: [],
        cumulativeSupplySideRevenueUSD: [],
        cumulativeProtocolSideRevenueUSD: [],
        cumulativeTotalRevenueUSD: [],
        cumulativeVolumeUSD: [],
        cumulativeUniqueUsers: [],
        totalPoolCount: [],
        cumulativeUniqueDepositors: [],
        cumulativeUniqueBorrowers: [],
        cumulativeUniqueLiquidators: [],
        cumulativeUniqueLiquidatees: [],
        openPositionCount: [],
        cumulativePositionCount: [],
        totalDepositBalanceUSD: [],
        cumulativeDepositUSD: [],
        totalBorrowBalanceUSD: [],
        cumulativeLiquidateUSD: [],
    };
    protocolErrorMsgs.forEach(msgObj => {
        const splitMsg = msgObj.split("LIST:");
        const type = splitMsg[0].split('\n')[0].trim();
        alertedErrors[type] = [...alertedErrors[type], ...splitMsg[1]].join('');
    })

    const errorsToAlert = {
        totalValueLockedUSD: [],
        cumulativeSupplySideRevenueUSD: [],
        cumulativeProtocolSideRevenueUSD: [],
        cumulativeTotalRevenueUSD: [],
        cumulativeVolumeUSD: [],
        cumulativeUniqueUsers: [],
        totalPoolCount: [],
        cumulativeUniqueDepositors: [],
        cumulativeUniqueBorrowers: [],
        cumulativeUniqueLiquidators: [],
        cumulativeUniqueLiquidatees: [],
        openPositionCount: [],
        cumulativePositionCount: [],
        totalDepositBalanceUSD: [],
        cumulativeDepositUSD: [],
        totalBorrowBalanceUSD: [],
        cumulativeLiquidateUSD: [],
    }

    Object.entries(deployments).forEach(([depo, val]) => {
        Object.entries(val.protocolErrors).forEach(([issueSet, issueArr]) => {
            if (issueArr.length > 0) {
                issueArr.forEach(iss => {
                    if (iss.includes(depo) && !alertedErrors[issueSet].includes(depo)) {
                        if ((depo.includes('pending') && iss.includes('pending')) || (!depo.includes('pending') && !iss.includes('pending'))) {
                            const hyperlink = `[ ${iss.split("//")[0]} ] (https://subgraphs.messari.io/subgraph?endpoint=${val.url}&tab=protocol)`
                            errorsToAlert[issueSet].push(`${iss.split("//")[0]} https://subgraphs.messari.io/subgraph?endpoint=${val.url}&tab=protocol, Value(s): ${iss.split("//")[1]}`);
                        }
                    }
                })
            }
        });
    });

    const protocolErrs = [];
    Object.entries(errorsToAlert).forEach(([type, val]) => {
        if (val?.length > 0 && protocolErrs.join(" - ").length < 1400) {
            const newProtocolErrorDiscordMessage = `
**PROTOCOL ERRORS:**

${protocolErrorMessages[type]}

TYPE: ${type}

LIST:

${val.join(",\n")}
`;
            promiseArr.push(sendDiscordMessage(newProtocolErrorDiscordMessage));
        }
    })
    // Turn requests into a promise array 
    await Promise.allSettled(promiseArr)
        .then(
            (response) => {
                response.forEach((res) => {
                    if (res?.reason?.response?.status === 429 && JSON.parse(res?.reason?.config?.data)?.content) {
                        queriesToAttempt.push(JSON.parse(res?.reason?.config?.data)?.content);
                    } else if (res?.value) {
                        queriesToAttempt.push(res.value);
                    }
                })
            }
        )
        .catch((err) => console.log(err, 'err'));
    return queriesToAttempt;
}