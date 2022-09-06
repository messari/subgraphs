import axios from "axios";

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
                queryToUse = `query{ lendingProtocols {
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
                queryToUse = `query { lendingProtocols {
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
                queryToUse = `query { yieldAggregators {
              name
          network
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
          cumulativeUniqueUsers
        }}`;
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

        const buildIssue = (value) => deploymentName + "//" + value;
        if (
            !(
                data.totalValueLockedUSD > 10000 &&
                data.totalValueLockedUSD < 100000000000
            )
        ) {
            issuesArrays.tvlRange.push(buildIssue(parseFloat(data.totalValueLockedUSD).toFixed(2)));
        }

        if (
            !(
                data.cumulativeSupplySideRevenueUSD >= 0 &&
                data.cumulativeSupplySideRevenueUSD <= 100000000000
            )
        ) {
            issuesArrays.cumulativeSupplySideRev.push(buildIssue(parseFloat(data.cumulativeSupplySideRevenueUSD).toFixed(2)));
        }

        if (
            !(
                data.cumulativeProtocolSideRevenueUSD >= 0 &&
                data.cumulativeProtocolSideRevenueUSD <= 100000000000
            )
        ) {
            issuesArrays.cumulativeProtocolSideRev.push(buildIssue(parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2)));
        }

        if (
            (
                parseFloat(data.cumulativeProtocolSideRevenueUSD) +
                parseFloat(data.cumulativeSupplySideRevenueUSD)
            ).toFixed(2) !== parseFloat(data.cumulativeTotalRevenueUSD).toFixed(2)
        ) {
            const value = ((parseFloat(data.cumulativeProtocolSideRevenueUSD) +
                parseFloat(data.cumulativeSupplySideRevenueUSD)) +
                " " +
                parseFloat(data.cumulativeTotalRevenueUSD).toFixed(2) +
                " = " +
                parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2) +
                " + " +
                parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2));

            issuesArrays.cumulativeTotalRev.push(buildIssue(value));
        }

        if (
            dataFields.includes("cumulativeVolumeUSD") &&
            !(parseFloat(data.cumulativeVolumeUSD) > 10000)
        ) {
            issuesArrays.cumulativeVol.push(buildIssue(parseFloat(data.cumulativeVolumeUSD).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativeUniqueUsers") &&
            !(parseFloat(data.cumulativeUniqueUsers) > 100 && parseFloat(data.cumulativeUniqueUsers) < 100000000)
        ) {
            issuesArrays.cumulativeUniqueUsers.push(buildIssue(data.cumulativeUniqueUsers));
        }

        if (
            dataFields.includes("totalPoolCount") &&
            !(parseFloat(data.totalPoolCount) > 0 && parseFloat(data.totalPoolCount) < 10000)
        ) {
            issuesArrays.totalPoolCount.push(buildIssue(parseFloat(data.totalPoolCount)));
        }

        if (
            dataFields.includes("cumulativeUniqueDepositors") &&
            parseFloat(data.cumulativeUniqueDepositors) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueDepos.push(buildIssue(parseFloat(data.cumulativeUniqueDepositors)));
        }

        if (
            dataFields.includes("cumulativeUniqueBorrowers") &&
            parseFloat(data.cumulativeUniqueBorrowers) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueBorrowers.push(buildIssue(parseFloat(data.cumulativeUniqueBorrowers).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativeUniqueLiquidators") &&
            parseFloat(data.cumulativeUniqueLiquidators) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueLiquidators.push(buildIssue(parseFloat(data.cumulativeUniqueLiquidators).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativeUniqueLiquidatees") &&
            parseFloat(data.cumulativeUniqueLiquidatees) <
            parseFloat(data.cumulativeUniqueUsers)
        ) {
            issuesArrays.cumulativeUniqueLiquidatees.push(buildIssue(parseFloat(data.cumulativeUniqueLiquidatees).toFixed(2)));
        }

        if (
            dataFields.includes("openPositionCount") &&
            !(parseFloat(data.openPositionCount) > 100 && parseFloat(data.openPositionCount) < 1000000000)
        ) {
            issuesArrays.openPositionCount.push(buildIssue(parseFloat(data.openPositionCount).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativePositionCount") &&
            !(
                parseFloat(data.cumulativePositionCount) >=
                parseFloat(data.openPositionCount)
            )
        ) {
            issuesArrays.cumulativePositionCount.push(buildIssue(parseFloat(data.cumulativePositionCount).toFixed(2)));
        }

        if (
            dataFields.includes("totalDepositBalanceUSD") &&
            !(parseFloat(data.totalDepositBalanceUSD) > 10000 && parseFloat(data.totalDepositBalanceUSD) < 100000000000)
        ) {
            issuesArrays.totalDepoBal.push(buildIssue(parseFloat(data.totalDepositBalanceUSD).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativeDepositUSD") &&
            !(
                parseFloat(data.cumulativeDepositUSD) >=
                parseFloat(data.totalDepositBalanceUSD)
            )
        ) {
            issuesArrays.cumulativeDepo.push(buildIssue(parseFloat(data.cumulativeDepositUSD).toFixed(2)));
        }

        if (
            dataFields.includes("totalBorrowBalanceUSD") &&
            !(
                parseFloat(data.totalBorrowBalanceUSD) <=
                parseFloat(data.totalDepositBalanceUSD)
            )
        ) {
            issuesArrays.totalBorrowBal.push(buildIssue(parseFloat(data.totalBorrowBalanceUSD).toFixed(2)));
        }

        if (
            dataFields.includes("cumulativeLiquidateUSD") &&
            !(
                parseFloat(data.cumulativeLiquidateUSD) <=
                parseFloat(data.cumulativeBorrowUSD)
            )
        ) {
            issuesArrays.cumulativeLiquidate.push(buildIssue(parseFloat(data.cumulativeLiquidateUSD).toFixed(2)));
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
