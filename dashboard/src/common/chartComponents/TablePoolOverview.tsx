import { Box, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router";

interface TableChartProps {
  datasetLabel: string;
  dataTable: any;
  protocolType: string;
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  skipAmt: number;
}

const tableCellTruncate: any = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const TablePoolOverview = ({
  datasetLabel,
  dataTable,
  protocolType,
  handleTabChange,
  setPoolId,
  skipAmt,
}: TableChartProps) => {
  const navigate = useNavigate();
  if (dataTable) {
    const optionalFields = [];
    let baseFieldCol = false;
    let inputTokenLabel = "Input Token";
    let inputTokenColWidth = 160;
    if (protocolType === "EXCHANGE") {
      inputTokenLabel = "Input Tokens";
      inputTokenColWidth = 220;
      optionalFields.push({
        field: "baseYield",
        headerName: "Base Yield %",
        width: 180,
        renderCell: (params: any) => {
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{params.value}</span>
            </Tooltip>
          );
        },
      });
      baseFieldCol = true;
    }
    let columns = [
      { field: "idx", headerName: "#", width: 12 },
      {
        field: "name",
        headerName: "Name",
        width: 200,
        renderCell: (params: any) => {
          let nameStr = params.value;
          if (nameStr.length > 16) {
            nameStr = `${params.value.slice(0, 7)}...${params.value.slice(
              params.value.length - 8,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{nameStr}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "poolId",
        headerName: "Pool ID",
        width: 280,
        renderCell: (params: any) => {
          let poolIdStr = params.value;
          if (poolIdStr.length > 20) {
            poolIdStr = `${params.value.slice(0, 10)}...${params.value.slice(
              params.value.length - 15,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span
                onClick={() => (window.location.href = "https://etherscan.io/address/" + params.value)}
                style={tableCellTruncate}
              >
                {poolIdStr}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "inputToken",
        headerName: inputTokenLabel,
        width: inputTokenColWidth,
        renderCell: (params: any) => {
          let inputTokenStr = params.value;
          if (inputTokenStr.length > 15) {
            inputTokenStr = `${params.value.slice(0, 6)}...${params.value.slice(
              params.value.length - 7,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{inputTokenStr}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "tvl",
        headerName: "TVL (USD)",
        width: 180,
        renderCell: (params: any) => {
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{params.value}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "rewardTokens",
        headerName: "Reward Tokens",
        width: inputTokenColWidth,
        renderCell: (params: any) => {
          let rewardTokenStr = params.value;
          if (rewardTokenStr.length > 18) {
            rewardTokenStr = `${params.value.slice(0, 8)}...${params.value.slice(
              params.value.length - 7,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{rewardTokenStr}</span>
            </Tooltip>
          );
        },
      },
    ];
    columns = columns.concat(optionalFields);
    const tableData = dataTable.map((pool: any, i: any) => {
      let inputTokenSymbol = pool?.inputToken?.symbol;
      if (pool.inputTokens) {
        inputTokenSymbol = pool.inputTokens.map((tok: any) => tok.symbol).join(", ");
      }
      const returnObj: { [x: string]: string } = {
        id: i + 1 + skipAmt,
        idx: i + 1 + skipAmt,
        name: pool.name || "N/A",
        poolId: pool.id,
        inputToken: inputTokenSymbol,
        tvl: "$" + Number(Number(pool.totalValueLockedUSD).toFixed(2)).toLocaleString(),
        rewardTokens: "",
      };
      if (pool.rewardTokens?.length > 0) {
        const rewardTokenSymbol = pool.rewardTokens.map((tok: any) => {
          if (tok?.symbol) {
            return tok.symbol;
          } else if (tok?.token?.symbol) {
            return tok?.token?.symbol;
          }
          return "N/A";
        });
        // returnObj.rewardTokens = `[${rewardTokenSymbol.join(", ")}]`;

        const rewardAPYs = pool.rewardTokenEmissionsUSD.map((val: string, idx: number) => {
          let apr = 0;
          if (pool?.totalDepositBalanceUSD && protocolType === "LENDING") {
            apr = (Number(val) / pool.totalDepositBalanceUSD) * 100 * 365;
          } else {
            if (
              (!Number(pool?.stakedOutputTokenAmount) || !Number(pool?.outputTokenSupply)) &&
              Number(pool.totalValueLockedUSD) !== 0
            ) {
              apr = (Number(val) / Number(pool.totalValueLockedUSD)) * 100 * 365;
            } else {
              apr =
                (Number(val) /
                  (Number(pool.totalValueLockedUSD) *
                    (Number(pool?.stakedOutputTokenAmount) / Number(pool?.outputTokenSupply)))) *
                100 *
                365;
            }
          }
          if (isNaN(apr)) {
            apr = 0;
          }
          return Number(apr).toFixed(2) + "%";
        });
        const rewardTokenCell = rewardTokenSymbol.map((tok: string, idx: number) => {
          let str = `0.00% ${tok}`;
          if (rewardAPYs[idx]) {
            str = `${rewardAPYs[idx]} ${tok}`;
          }
          return str;
        });
        returnObj.rewardTokens = rewardTokenCell.join(", ");
        // returnObj.rewardAPY = `[${rewardAPYs.join(", ")}]`;
      } else {
        returnObj.rewardTokens = "No Reward Token";
      }
      if (baseFieldCol) {
        returnObj.baseYield = "%0.00";
        if (Object.keys(pool?.fees)?.length > 0 && pool?.totalValueLockedUSD) {
          // CURRENTLY THE FEE IS BASED OFF OF THE POOL RATHER THAN THE TIME SERIES. THIS IS TEMPORARY
          const supplierFee = pool.fees.find((fee: { [x: string]: string }) => {
            return fee.feeType === "FIXED_LP_FEE" || fee.feeType === "DYNAMIC_LP_FEE";
          });
          let feePercentage = 0;
          if (supplierFee) {
            feePercentage = Number(supplierFee.feePercentage);
          }
          const volumeUSD = Number(pool.cumulativeVolumeUSD);
          let value = ((feePercentage * volumeUSD) / Number(pool.totalValueLockedUSD)) * 100;
          if (!value || !Number(pool.totalValueLockedUSD)) {
            value = 0;
          }
          returnObj.baseYield = "%" + value.toFixed(2);
        }
      }
      return returnObj;
    });
    return (
      <Box height={52 * (tableData.length + 1.5)} py={6} id={"tableID"}>
        <DataGrid
          sx={{ textOverflow: "clip" }}
          onRowClick={(row) => {
            const href = new URL(window.location.href);
            const p = new URLSearchParams(href.search);
            p.set("tab", "pool");
            p.set("poolId", row.row.poolId);
            navigate("?" + p.toString());
            setPoolId(row.row.poolId);
            handleTabChange(null, "3");
          }}
          columnBuffer={7}
          initialState={{
            sorting: {
              sortModel: [{ field: "id", sort: "desc" }],
            },
          }}
          hideFooter={true}
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
