import axios from "axios";
import { formatIntToFixed2 } from "./util.js";

export const protocolLevel = async (deployments) => {
    const endpointsList = [];

    Object.values(deployments).forEach((depo) => {
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
        .catch((err) => console.log(err));
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
                        name
                        network
                        cumulativeVolumeUSD
                        cumulativeUniqueUsers
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                    }
                }`;
            }
        } else if (deployment.data.protocols[0].type.toUpperCase() === "LENDING") {
            if (versionGroup === "2.0") {
                queryToUse = `
                query {
                    lendingProtocols {
                        name
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
                        name
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
                        name
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
        .catch((err) => console.log(err));

    protocolTypeLevelData.forEach((protocol) => {
        // find deployments objectbased on deployments.url === protocol.url
        const deploymentName = Object.keys(deployments).find(
            (depoName) => deployments[depoName]?.url === protocol?.url
        );
        const deployment = { ...deployments[deploymentName] };

        const issuesArrays = { ...deployment.protocolErrors };

        if (!protocol?.protocol) return;
        const data = protocol.protocol[Object.keys(protocol.protocol)[0]][0];
        if (!data) return;
        const url = protocol.url;

        const dataFields = Object.keys(data);

        if (
            !(
                data.totalValueLockedUSD > 10000 &&
                data.totalValueLockedUSD < 100000000000
            )
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
            (
                parseFloat(data.cumulativeProtocolSideRevenueUSD) +
                parseFloat(data.cumulativeSupplySideRevenueUSD)
            ).toFixed(2) !== parseFloat(data.cumulativeTotalRevenueUSD).toFixed(2)
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
            !(parseFloat(data.cumulativeVolumeUSD) > 10000)
        ) {
            issuesArrays.cumulativeVolumeUSD.push('$' + formatIntToFixed2(parseFloat(data.cumulativeVolumeUSD)));
        }

        if (
            dataFields.includes("cumulativeUniqueUsers") &&
            !(parseFloat(data.cumulativeUniqueUsers) > 100 && parseFloat(data.cumulativeUniqueUsers) < 100000000)
        ) {
            issuesArrays.cumulativeUniqueUsers.push(data.cumulativeUniqueUsers);
        }

        if (
            dataFields.includes("totalPoolCount") &&
            !(parseFloat(data.totalPoolCount) > 0 && parseFloat(data.totalPoolCount) < 10000)
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
            !(parseFloat(data.openPositionCount) > 100 && parseFloat(data.openPositionCount) < 1000000000)
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
            !(parseFloat(data.totalDepositBalanceUSD) > 10000 && parseFloat(data.totalDepositBalanceUSD) < 100000000000)
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
            )
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
