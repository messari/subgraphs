import axios from "axios";
import { errorNotification } from "./messageDiscord.js";
import { formatIntToFixed2, ProtocolTypeEntityName } from "./util.js";

export const protocolLevel = async (deployments, invalidDeployments) => {
    const endpointsList = [];

    Object.keys(deployments).forEach((key) => {
        if (invalidDeployments.includes(key)) {
            return;
        }
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
            if (versionGroup === "2.0") {
                queryToUse = ``;
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
            if (versionGroup === "2.0") {
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
                        cumulativeDepositUSD
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
                        cumulativeDepositUSD
                        totalBorrowBalanceUSD
                        cumulativeBorrowUSD
                        cumulativeLiquidateUSD
                    }
                }`;
            }
        } else if (deployment.data.protocols[0].type.toUpperCase() === "YIELD") {
            if (versionGroup === "2.0") {
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

    protocolTypeLevelData.forEach((protocol) => {
        const deploymentName = Object.keys(deployments).find(
            (depoName) => deployments[depoName]?.url === protocol?.url
        );
        const deployment = { ...deployments[deploymentName] };

        const issuesArrays = { ...deployment.protocolErrors };

        if (!protocol?.protocol) return;
        const data = protocol.protocol[Object.keys(protocol.protocol)[0]][0];
        if (!data) return;

        const dataFields = Object.keys(data);

        if (
            !(
                data.totalValueLockedUSD >= 0 &&
                data.totalValueLockedUSD < 10000000000
            ) &&
            deployment.protocolType === 'dex-amm'
        ) {
            issuesArrays.totalValueLockedUSD.push('$' + formatIntToFixed2(parseFloat(data.totalValueLockedUSD)));
        }

        if (
            !(
                data.cumulativeSupplySideRevenueUSD >= 0 &&
                data.cumulativeSupplySideRevenueUSD <= 100000000000
            )
        ) {
            issuesArrays.cumulativeSupplySideRevenueUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeSupplySideRevenueUSD)));
        }

        if (
            !(
                data.cumulativeProtocolSideRevenueUSD >= 0 &&
                data.cumulativeProtocolSideRevenueUSD <= 100000000000
            )
        ) {
            issuesArrays.cumulativeProtocolSideRevenueUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeProtocolSideRevenueUSD)));
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

            issuesArrays.cumulativeTotalRevenueUSD.push(value);
        }

        if (
            dataFields.includes("cumulativeVolumeUSD") &&
            !(parseFloat(data.cumulativeVolumeUSD) >= 0)
        ) {
            issuesArrays.cumulativeVolumeUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeVolumeUSD)));
        }

        if (
            dataFields.includes("cumulativeUniqueUsers") &&
            !(parseFloat(data.cumulativeUniqueUsers) >= 0 && parseFloat(data.cumulativeUniqueUsers) < 100000000)
        ) {
            issuesArrays.cumulativeUniqueUsers.push(data.cumulativeUniqueUsers);
        }

        if (
            dataFields.includes("totalPoolCount") &&
            !(parseFloat(data.totalPoolCount) >= 0 && parseFloat(data.totalPoolCount) < 10000)
        ) {
            issuesArrays.totalPoolCount.push(data.totalPoolCount);
        }

        if (
            dataFields.includes("cumulativeUniqueDepositors") &&
            parseFloat(data.cumulativeUniqueDepositors) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueDepositors.push(data.cumulativeUniqueDepositors);
        }

        if (
            dataFields.includes("cumulativeUniqueBorrowers") &&
            parseFloat(data.cumulativeUniqueBorrowers) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueBorrowers.push(data.cumulativeUniqueBorrowers);
        }

        if (
            dataFields.includes("cumulativeUniqueLiquidators") &&
            parseFloat(data.cumulativeUniqueLiquidators) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueLiquidators.push(data.cumulativeUniqueLiquidators);
        }

        if (
            dataFields.includes("cumulativeUniqueLiquidatees") &&
            parseFloat(data.cumulativeUniqueLiquidatees) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueLiquidatees.push(data.cumulativeUniqueLiquidatees);
        }

        if (
            dataFields.includes("openPositionCount") &&
            !(parseFloat(data.openPositionCount) >= 0 && parseFloat(data.openPositionCount) < 1000000000)
        ) {
            issuesArrays.openPositionCount.push(data.openPositionCount);
        }

        if (
            dataFields.includes("cumulativePositionCount") &&
            !(
                parseFloat(data.cumulativePositionCount) >=
                parseFloat(data.openPositionCount)
            )
        ) {
            issuesArrays.cumulativePositionCount.push(data.cumulativePositionCount);
        }

        if (
            dataFields.includes("totalDepositBalanceUSD") &&
            !(parseFloat(data.totalDepositBalanceUSD) >= 0 && parseFloat(data.totalDepositBalanceUSD) < 100000000000)
        ) {
            issuesArrays.totalDepositBalanceUSD.push('$' + formatIntToFixed2(parseFloat(data.totalDepositBalanceUSD)));
        }

        if (
            dataFields.includes("cumulativeDepositUSD") &&
            !(
                parseFloat(data.cumulativeDepositUSD) >=
                parseFloat(data.totalDepositBalanceUSD)
            )
        ) {
            issuesArrays.cumulativeDepositUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeDepositUSD)));
        }

        if (
            dataFields.includes("totalBorrowBalanceUSD") &&
            !(
                parseFloat(data.totalBorrowBalanceUSD) <=
                parseFloat(data.totalDepositBalanceUSD)
            ) &&
            !deploymentName.includes("rari-fuse") &&
            !deploymentName.includes("truefi") &&
            !deploymentName.includes("maple") &&
            !deploymentName.includes("goldfinch")

        ) {
            issuesArrays.totalBorrowBalanceUSD.push('$' + formatIntToFixed2(parseFloat(data.totalBorrowBalanceUSD)));
        }

        if (
            dataFields.includes("cumulativeLiquidateUSD") &&
            !(
                parseFloat(data.cumulativeLiquidateUSD) <=
                parseFloat(data.cumulativeBorrowUSD)
            )
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

export const protocolDerivedFields = async (deployments, invalidDeployments) => {

    // Loop deployments object and get protocol type and scema version for every deployment on every protocol
    // Create queries for different schema types and versions
    // Queries are only to take first result of derived fields on the main protocol entity

    const derivedFieldQueries = {
        "lendingProtocol": (depo) => `{
            ${depo}: lendingProtocols {
                dailyUsageMetrics (first: 1){
                  id
                }
                hourlyUsageMetrics (first: 1){
                  id
                }
                financialMetrics (first: 1){
                  id
                }
                markets (first: 1){
                  id
                }
            }
        }`,
        "dexAmmProtocol": (depo) => `{
            ${depo}: dexAmmProtocols {
                dailyUsageMetrics (first: 1){
                  id
                }
                hourlyUsageMetrics (first: 1){
                  id
                }
                financialMetrics (first: 1){
                  id
                }
                pools (first: 1){
                  id
                }
            }
        }`,
        "yieldAggregator": (depo) => `{
            ${depo}: yieldAggregators {
                dailyUsageMetrics (first: 1){
                  id
                }
                hourlyUsageMetrics (first: 1){
                  id
                }
                financialMetrics (first: 1){
                  id
                }
                vaults (first: 1){
                  id
                }
            }
        }`,
        "protocol": (depo) => `{
            ${depo}: protocols {
                dailyUsageMetrics (first: 1){
                  id
                }
                hourlyUsageMetrics (first: 1){
                  id
                }
                financialMetrics (first: 1){
                  id
                }
                pools (first: 1){
                  id
                }
            }
        }`
    };

    const derivedFieldQueriesToMake = [];
    Object.keys(deployments).forEach((key) => {
        if (invalidDeployments.includes(key)) {
            return;
        }
        const depo = deployments[key];
        const queryKey = ProtocolTypeEntityName[depo.protocolType];
        if (!queryKey) {
            return;
        }
        const depoQuery = derivedFieldQueries[queryKey](key.split("-").join("_"));
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
                const depoKey = Object.keys(deployments).find(depo => deployments[depo].url === x.value.config.url)
                let alert = ``;

                if (returnedData) {
                    const key = Object.keys(returnedData)[0];
                    if (returnedData[key]?.length === 0 || !returnedData[key]) {
                        // alert for no protocol entity found
                        deploymentsToReturn[depoKey].protocolErrors.protocolEntity.push(ProtocolTypeEntityName[deploymentsToReturn[depoKey].protocolType]);
                    } else {
                        const emptyFields = Object.keys(returnedData[key][0]).filter(field => !returnedData[key][0][field] || returnedData[key][0][field]?.length === 0);
                        if (emptyFields.length > 0 && !depoKey.toUpperCase().includes('THE-GRAPH')) {
                            deploymentsToReturn[depoKey].protocolErrors.relatedField.push(emptyFields.join(', '));
                        }
                    }
                }

                if (returnedError) {
                    const alertArr = returnedError.filter(errObj => errObj.message !== "indexing_error").map(errObj => errObj.message).filter(alert => !alert.includes("Store error: database unavailable"));
                    if (alertArr.length > 0) {
                        alert = alertArr.join(" --- ");
                        errorNotification("ERROR LOCATION 28 " + alert)
                        deploymentsToReturn[depoKey].protocolErrors.queryError.push(alert);
                        // Map through errors and save the messages to protocolDerivedFieldErrors on depo object
                        // Maybe save the query to this object to help reproduceability
                    }
                }

            }))
        )
        .catch((err) => errorNotification("ERROR LOCATION 17 " + err.message));
    return deploymentsToReturn;
}