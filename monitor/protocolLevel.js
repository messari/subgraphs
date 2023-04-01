import axios from "axios";
import { errorNotification } from "./messageDiscord.js";
import { formatIntToFixed2, ProtocolTypeEntityName } from "./util.js";

export const protocolLevel = async (deployments) => {
    const endpointsList = [];
    Object.keys(deployments).forEach((key) => {
        const depo = deployments[key];
        if (!depo.indexingError) {
            endpointsList.push(depo.url);
        }
    });

    const baseQuery = `query MyQuery {
          protocols {
              name
              schemaVersion
              type
          }
      }`;
    const promiseArr = [];
    endpointsList.forEach((endpoint) => {
        promiseArr.push(
            axios.post(
                endpoint,
                { query: baseQuery },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    let protocolLevelData = [];
    await Promise.allSettled(promiseArr)
        .then(
            (response) =>
            (protocolLevelData = response.map((protocolData) => {
                if (!protocolData?.value) return null;
                return ({
                    data: protocolData?.value?.data?.data,
                    url: protocolData?.value?.config?.url,
                })
            }))
        )
        .catch((err) => errorNotification("ERROR LOCATION 16 " + err.message));
    const specificDataPromiseArray = [];
    protocolLevelData.forEach((deployment) => {
        if (!deployment?.data) return;
        if (!deployment?.data?.protocols) return;
        if (!deployment?.data?.protocols[0]?.schemaVersion) return;

        const versionGroupArr =
            deployment.data?.protocols[0]?.schemaVersion?.split(".");
        versionGroupArr.pop();
        const versionGroup = versionGroupArr.join(".") + ".0";

        let queryToUse = ``;

        if (deployment.data.protocols[0].type.toUpperCase() === "EXCHANGE") {
            if (versionGroup === "2.0.0") {
                queryToUse = ``;
            } else if (versionGroup === "1.3.0") {
                queryToUse = `query {
                    dexAmmProtocols {
                        id
                        name
                        slug
                        schemaVersion
                        subgraphVersion
                        methodologyVersion
                        network
                        type
                        cumulativeVolumeUSD
                        cumulativeUniqueUsers
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        totalPoolCount
                    }
                }`;
            } else {
                queryToUse = `
                query {
                    dexAmmProtocols {
                        id
                        name
                        slug
                        schemaVersion
                        subgraphVersion
                        methodologyVersion
                        network
                        type
                        cumulativeVolumeUSD
                        cumulativeUniqueUsers
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        cumulativeUniqueLPs
                        cumulativeUniqueTraders
                        totalPoolCount
                        openPositionCount
                        cumulativePositionCount
                    }
                }`;
            }
        } else if (deployment.data.protocols[0].type.toUpperCase() === "LENDING") {
            if (versionGroup === "2.0.0") {
                queryToUse = `
                query {
                    lendingProtocols {
                        id
                        name
                        slug
                        network
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        cumulativeUniqueUsers
                        cumulativeUniqueDepositors
                        cumulativeUniqueBorrowers
                        cumulativeUniqueLiquidators
                        cumulativeUniqueLiquidatees
                        openPositionCount
                        cumulativePositionCount
                        totalPoolCount
                        totalDepositBalanceUSD
                        totalBorrowBalanceUSD
                        cumulativeBorrowUSD
                        cumulativeLiquidateUSD
                    }
                }`;
            } else {
                queryToUse = `
                query {
                    lendingProtocols {
                        id
                        name
                        slug
                        network
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        cumulativeUniqueUsers
                        totalDepositBalanceUSD
                        totalBorrowBalanceUSD
                        cumulativeBorrowUSD
                        cumulativeLiquidateUSD
                    }
                }`;
            }
        } else if (deployment.data.protocols[0].type.toUpperCase() === "YIELD") {
            if (versionGroup === "2.0.0") {
                queryToUse = ``;
            } else {
                queryToUse = `
                query {
                    yieldAggregators {
                        id
                        name
                        slug
                        network
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        cumulativeUniqueUsers
                    }
                }`;
            }
        }

        if (queryToUse.length === 0) return;

        specificDataPromiseArray.push(
            axios.post(
                deployment.url,
                { query: queryToUse },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    let protocolTypeLevelData = [];
    await Promise.allSettled(specificDataPromiseArray)
        .then(
            (response) => (protocolTypeLevelData = response.map((protocolData) => {
                if (!protocolData?.value) return null;
                return ({
                    protocol: protocolData?.value?.data?.data,
                    url: protocolData?.value?.config?.url,
                })
            }))
        )
        .catch((err) => errorNotification("ERROR LOCATION 17 " + err.message));

    protocolTypeLevelData.forEach((protocolData) => {
        const deploymentName = Object.keys(deployments).find(
            (depoName) => deployments[depoName]?.url === protocolData?.url
        );
        const deployment = { ...deployments[deploymentName] };

        const issuesArrays = { ...deployment.protocolErrors };
        const protocolEntityData = protocolData?.protocol;
        if (!protocolEntityData) return;
        const data = protocolEntityData[Object.keys(protocolEntityData)[0]][0];
        if (!data) return;

        const dataFields = Object.keys(data);

        if (
            !(
                data.totalValueLockedUSD >= 0 &&
                data.totalValueLockedUSD < 10000000000
            ) &&
            deployment.protocolType === 'dex-amm' &&
            !issuesArrays.totalValueLockedUSD.includes('$' + formatIntToFixed2(parseFloat(data.totalValueLockedUSD)))
        ) {
            issuesArrays.totalValueLockedUSD.push('$' + formatIntToFixed2(parseFloat(data.totalValueLockedUSD)));
        }

        if (
            (!(
                data.cumulativeSupplySideRevenueUSD >= 0 &&
                data.cumulativeSupplySideRevenueUSD <= 100000000000
            ) ||
                !(
                    data.cumulativeProtocolSideRevenueUSD >= 0 &&
                    data.cumulativeProtocolSideRevenueUSD <= 100000000000
                )) &&
            !issuesArrays.cumulativeRevenueFactors
        ) {
            issuesArrays.cumulativeRevenueFactors.push('$' + formatIntToFixed2(parseFloat(data.cumulativeSupplySideRevenueUSD)) + ' | ' + '$' + formatIntToFixed2(parseFloat(data.cumulativeProtocolSideRevenueUSD)));
        }

        if (
            Math.abs((
                parseFloat(data.cumulativeProtocolSideRevenueUSD) +
                parseFloat(data.cumulativeSupplySideRevenueUSD)
            ) - parseFloat(data.cumulativeTotalRevenueUSD)) > 100
        ) {
            const value = (
                '$' + formatIntToFixed2(parseFloat(data.cumulativeTotalRevenueUSD)) +
                " != " +
                '$' + formatIntToFixed2(parseFloat(data.cumulativeProtocolSideRevenueUSD)) +
                " + " +
                '$' + formatIntToFixed2(parseFloat(data.cumulativeSupplySideRevenueUSD)));

            if (!issuesArrays.cumulativeTotalRevenueUSD.includes(value)) {
                issuesArrays.cumulativeTotalRevenueUSD.push(value);
            }
        }

        if (
            dataFields.includes("cumulativeVolumeUSD") &&
            !(parseFloat(data.cumulativeVolumeUSD) >= 0) &&
            !issuesArrays.cumulativeVolumeUSD.includes('$' + formatIntToFixed2(parseFloat(data.cumulativeVolumeUSD)))
        ) {
            issuesArrays.cumulativeVolumeUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeVolumeUSD)));
        }

        if (
            dataFields.includes("cumulativeUniqueUsers") &&
            !(parseFloat(data.cumulativeUniqueUsers) >= 0 && parseFloat(data.cumulativeUniqueUsers) < 100000000) &&
            !issuesArrays.cumulativeUniqueUsers.includes(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueUsers.push(data.cumulativeUniqueUsers);
        }

        if (
            dataFields.includes("totalPoolCount") &&
            !(parseFloat(data.totalPoolCount) >= 0 && parseFloat(data.totalPoolCount) < 500000) &&
            !issuesArrays.totalPoolCount.includes(data.totalPoolCount)
        ) {
            issuesArrays.totalPoolCount.push(data.totalPoolCount);
        }

        const userTypesStr = `${data.cumulativeUniqueDepositors || 0}+${data.cumulativeUniqueBorrowers || 0}+${data.cumulativeUniqueLiquidators || 0}+${data.cumulativeUniqueLiquidatees || 0}=${data.cumulativeUniqueUsers || 0}`;
        if (
            (dataFields.includes("cumulativeUniqueDepositors") &&
                parseFloat(data.cumulativeUniqueDepositors) >
                parseFloat(data.cumulativeUniqueUsers)) ||
            (dataFields.includes("cumulativeUniqueBorrowers") &&
                parseFloat(data.cumulativeUniqueBorrowers) >
                parseFloat(data.cumulativeUniqueUsers)) ||
            (dataFields.includes("cumulativeUniqueLiquidators") &&
                parseFloat(data.cumulativeUniqueLiquidators) >
                parseFloat(data.cumulativeUniqueUsers)) ||
            (dataFields.includes("cumulativeUniqueLiquidatees") &&
                parseFloat(data.cumulativeUniqueLiquidatees) >
                parseFloat(data.cumulativeUniqueUsers)) &&
            !issuesArrays.cumulativeUniqueUserFactors.includes(userTypesStr)
        ) {
            issuesArrays.cumulativeUniqueUserFactors.push(userTypesStr);
        }

        if (
            dataFields.includes("openPositionCount") &&
            !(parseFloat(data.openPositionCount) >= 0 &&
                parseFloat(data.openPositionCount) < 1000000000) &&
            !issuesArrays.openPositionCount.includes(data.openPositionCount)
        ) {
            issuesArrays.openPositionCount.push(data.openPositionCount);
        }

        if (
            dataFields.includes("cumulativePositionCount") &&
            !(
                parseFloat(data.cumulativePositionCount) >=
                parseFloat(data.openPositionCount)
            ) &&
            !issuesArrays.cumulativePositionCount.includes(data.cumulativePositionCount)
        ) {
            issuesArrays.cumulativePositionCount.push(data.cumulativePositionCount);
        }

        if (
            dataFields.includes("totalDepositBalanceUSD") &&
            !(parseFloat(data.totalDepositBalanceUSD) >= 0 && parseFloat(data.totalDepositBalanceUSD) < 100000000000) &&
            !issuesArrays.totalDepositBalanceUSD.includes('$' + formatIntToFixed2(parseFloat(data.totalDepositBalanceUSD)))
        ) {
            issuesArrays.totalDepositBalanceUSD.push('$' + formatIntToFixed2(parseFloat(data.totalDepositBalanceUSD)));
        }

        const totalBorrowBalanceUSDExcluded = ["rari-fuse", "truefi", "maple", "goldfinch"];

        if (
            dataFields.includes("totalBorrowBalanceUSD") &&
            !(
                parseFloat(data.totalBorrowBalanceUSD) <=
                parseFloat(data.totalDepositBalanceUSD)
            ) &&
            !totalBorrowBalanceUSDExcluded.find(x => deploymentName.includes(x)) &&
            !issuesArrays.totalBorrowBalanceUSD.includes('$' + formatIntToFixed2(parseFloat(data.totalBorrowBalanceUSD)))
        ) {
            issuesArrays.totalBorrowBalanceUSD.push('$' + formatIntToFixed2(parseFloat(data.totalBorrowBalanceUSD)));
        }

        if (
            dataFields.includes("cumulativeLiquidateUSD") &&
            !(
                parseFloat(data.cumulativeLiquidateUSD) <=
                parseFloat(data.cumulativeBorrowUSD)
            ) &&
            !issuesArrays.cumulativeLiquidateUSD.includes('$' + formatIntToFixed2(parseFloat(data.cumulativeLiquidateUSD)))
        ) {
            issuesArrays.cumulativeLiquidateUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeLiquidateUSD)));
        }
        deployments[deploymentName].protocolErrors = issuesArrays;
    });

    const deploymentsObjToReturn = {};
    Object.entries(deployments).forEach(([x, depoObj]) => {
        deploymentsObjToReturn[x] = { ...depoObj };
        const key = deploymentsObjToReturn[x].protocolErrors;
        Object.entries(key).forEach(([errorKey, val]) => {
            if (val.length !== 0) {
                deploymentsObjToReturn[x].protocolErrors[errorKey] = val;
            }
        });
    });
    return deploymentsObjToReturn;
}

export const protocolDerivedFields = async (deployments) => {

    const derivedFieldQuery = (depo, type) => {
        const protocolEntityType = {
            "lendingProtocol": "markets",
            "dexAmmProtocol": "pools",
            "yieldAggregator": "vaults",
            "protocol": "pools"
        }
        const entityToUse = protocolEntityType[type];
        return `{
            ${depo}: ${type}s {
                dailyUsageMetrics (first: 1){
                  id
                }
                hourlyUsageMetrics (first: 1){
                  id
                }
                financialMetrics (first: 1){
                  id
                }
                ${entityToUse} (first: 1){
                  id
                }
            }
        }`;
    };

    const derivedFieldQueriesToMake = [];
    Object.keys(deployments).forEach((key) => {
        const depo = deployments[key];
        const queryKey = ProtocolTypeEntityName[depo.protocolType];
        if (!queryKey) {
            return;
        }
        const depoQuery = derivedFieldQuery(key.split("-").join("_"), queryKey);
        derivedFieldQueriesToMake.push(
            axios.post(
                depo.url,
                { query: depoQuery },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    const deploymentsToReturn = JSON.parse(JSON.stringify(deployments));

    await Promise.allSettled(derivedFieldQueriesToMake)
        .then(
            (response) => (response.map(x => {
                const returnedData = x?.value?.data?.data;
                const returnedError = x?.value?.data?.errors;
                const depoKey = Object.keys(deployments).find(depo => deployments[depo].url === x?.value?.config?.url);
                let alert = ``;

                if (returnedData && depoKey) {
                    const key = Object.keys(returnedData)[0];
                    if (returnedData[key]?.length === 0 || !returnedData[key]) {
                        // alert for no protocol entity found
                        deploymentsToReturn[depoKey].protocolErrors.protocolEntity.push(ProtocolTypeEntityName[deploymentsToReturn[depoKey].protocolType]);
                    } else {
                        const firstVal = returnedData[key][0];
                        const emptyFields = Object.keys(firstVal).filter(field => !firstVal[field] || firstVal[field]?.length === 0);
                        if (emptyFields.length > 0 && !depoKey.toUpperCase().includes('THE-GRAPH')) {
                            deploymentsToReturn[depoKey].protocolErrors.relatedField.push(emptyFields.join(', '));
                        }
                    }
                }

                if (returnedError?.length > 0) {
                    const alertArr = returnedError?.filter(errObj => errObj.message !== "indexing_error" && !errObj.message.includes("Store error: database unavailable"))?.map(errObj => errObj.message);
                    if (alertArr.length > 0) {
                        alert = alertArr.join(" --- ");
                        errorNotification("ERROR LOCATION 28 " + alert);
                        if (depoKey) {
                            deploymentsToReturn[depoKey].protocolErrors.queryError.push(alert);
                        }
                    }
                }

            }))
        )
        .catch((err) => errorNotification("ERROR LOCATION 17 " + err.message));
    return deploymentsToReturn;
}