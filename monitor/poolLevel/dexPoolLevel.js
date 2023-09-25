import axios from "axios";
import {
  ONE_HUNDRED_THOUSAND,
  TEN_BILLION,
  ONE_HUNDRED_BILLION,
} from "../util.js";

export const dexPoolLevel = async (deployments) => {
  const endpointsList = [];
  Object.keys(deployments).forEach((depo) => {
    if (
      !deployments[depo].indexingError &&
      deployments[depo].protocolType.toUpperCase() === "EXCHANGES"
    ) {
      endpointsList.push(deployments[depo].url);
    }
  });

  const baseQuery = `
    query MyQuery {
        protocols {
            id
            name
            type
            schemaVersion
        }
        liquidityPools (first: 1000) {
          id
          name
          totalValueLockedUSD
          cumulativeSupplySideRevenueUSD
          cumulativeProtocolSideRevenueUSD
          cumulativeTotalRevenueUSD
          cumulativeVolumeUSD
          outputTokenSupply
          outputTokenPriceUSD
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

  let poolLevelData = [];
  await Promise.all(promiseArr)
    .then(
      (response) =>
        (poolLevelData = response.map((poolData) => {
          return {
            liquidityPools: poolData?.data?.data?.liquidityPools || [],
            url: poolData.config.url,
            deployment:
              Object.keys(deployments).find(
                (key) => deployments[key].url === poolData.config.url
              ) || poolData.config.url.split("messari/")[1],
          };
        }))
    )
    .catch((err) => console.log(err.code, err.errno));

  poolLevelData.forEach((protocol, idx) => {
    if (!protocol?.liquidityPools) return;
    const data = protocol.liquidityPools;
    if (!data?.length) return;
    const url = protocol.url;
    // const dataFields = Object.keys(data)

    const deploymentName = protocol.deployment;
    const deployment = { ...deployments[deploymentName] };

    const issuesArrays = { ...deployment.poolErrors };

    data.forEach((instance) => {
      const buildIssue = (value) => instance.id;
      let currentIssueField = "totalValueLockedUSD";
      if (
        !(
          parseFloat(instance[currentIssueField]) > 0 &&
          parseFloat(instance[currentIssueField]) < ONE_HUNDRED_BILLION
        ) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(parseFloat(instance[currentIssueField]).toFixed(2))
        );
      }

      currentIssueField = "cumulativeSupplySideRevenueUSD";
      if (
        !(
          parseFloat(instance[currentIssueField]) >= 0 &&
          parseFloat(instance[currentIssueField]) <= TEN_BILLION
        ) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(parseFloat(instance[currentIssueField]).toFixed(2))
        );
      }

      currentIssueField = "cumulativeProtocolSideRevenueUSD";
      if (
        !(
          parseFloat(instance[currentIssueField]) >= 0 &&
          parseFloat(instance[currentIssueField]) <= TEN_BILLION
        ) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(parseFloat(instance[currentIssueField]).toFixed(2))
        );
      }

      currentIssueField = "cumulativeTotalRevenueUSD";
      if (
        (
          parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
          parseFloat(instance.cumulativeSupplySideRevenueUSD)
        ).toFixed(2) !== parseFloat(instance[currentIssueField]).toFixed(2) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        const value =
          parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
          parseFloat(instance.cumulativeSupplySideRevenueUSD) +
          "||" +
          parseFloat(data[currentIssueField]).toFixed(2) +
          "=" +
          parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2) +
          "+" +
          parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2);
        issuesArrays[currentIssueField].push(buildIssue(value));
      }

      currentIssueField = "cumulativeVolumeUSD";

      if (
        !(
          parseFloat(instance[currentIssueField]) > 0 &&
          parseFloat(instance[currentIssueField]) < TEN_BILLION
        )
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(parseFloat(instance[currentIssueField]))
        );
      }

      currentIssueField = "outputTokenSupply";
      if (
        !(parseFloat(instance[currentIssueField]) >= 0) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(instance[currentIssueField])
        );
      }

      currentIssueField = "outputTokenPriceUSD";
      if (
        !(
          parseFloat(instance[currentIssueField]) >= 0 &&
          parseFloat(instance[currentIssueField]) <= ONE_HUNDRED_THOUSAND
        ) &&
        !issuesArrays[currentIssueField]?.includes(instance.id)
      ) {
        issuesArrays[currentIssueField].push(
          buildIssue(instance[currentIssueField])
        );
      }
    });

    deployments[deploymentName].poolErrors = issuesArrays;
  });

  const depoHolder = {};
  Object.keys(deployments).forEach((x) => {
    depoHolder[x] = { ...deployments[x] };
    const key = depoHolder[x].poolErrors;
    if (!key) return;
    Object.keys(key).forEach((y) => {
      if (key[y].length !== 0) {
        depoHolder[x].poolErrors[y] = key[y];
      }
    });
  });
  return depoHolder;
};
