import { Tooltip } from "@material-ui/core";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { convertTokenDecimals, tableCellTruncate, toDate } from "../../../src/utils/index";
import { PoolName } from "../../constants";
import { CopyLinkToClipboard } from "../utilComponents/CopyLinkToClipboard";
import { blockExplorers } from "../../constants";

interface TableEventsProps {
  datasetLabel: string;
  protocolNetwork: string;
  data: any;
  eventName: string;
}

export const TableEvents = ({ datasetLabel, protocolNetwork, data, eventName }: TableEventsProps) => {
  const dataTable = data[eventName];
  const protocolType = data.protocols[0].type;
  const poolName = PoolName[protocolType];
  if (!data[poolName]) {
    return null;
  }
  if (dataTable && dataTable[0]) {
    const tableData: { [x: string]: any }[] = [];
    for (let i = 0; i < dataTable.length; i++) {
      const currentData: { [x: string]: any } = { ...dataTable[i] };
      if (currentData?.liquidatee?.id) {
        currentData.liquidatee = currentData.liquidatee.id;
      }
      if (currentData?.liquidator) {
        currentData.liquidator = currentData.liquidator.id;
      }
      if (currentData?.position) {
        currentData.position = currentData.position.id;
      }
      if (currentData?.account) {
        currentData.account = currentData.account.id;
      }
      if (currentData?.pool) {
        currentData.pool = currentData.pool.id;
      }
      if (currentData?.token) {
        currentData.token = currentData.token.name;
      }
      if (currentData?.amountInUSD) {
        currentData.amountInUSD = Number(currentData.amountInUSD);
      }
      if (currentData?.amountOutUSD) {
        currentData.amountOutUSD = Number(currentData.amountOutUSD);
      }
      if (currentData?.amountUSD) {
        currentData.amountUSD = Number(currentData.amountUSD);
      }
      if (data[poolName]?.inputToken) {
        const convertedAmt = convertTokenDecimals(currentData.amount, data[poolName].inputToken.decimals);
        currentData.amount = convertedAmt;
        tableData.push({ id: `${eventName}-${i}`, date: toDate(dataTable[i].timestamp), ...currentData });
      }
      if (data[poolName]?.inputTokens) {
        if (currentData.inputTokenAmounts) {
          const inputTokensDecimal = currentData.inputTokenAmounts.map((amt: string, idx: number) => {
            return convertTokenDecimals(amt, currentData.inputTokens[idx].decimals).toFixed(2);
          });
          const outputTokenDecimal = convertTokenDecimals(
            currentData?.outputTokenAmount,
            currentData?.outputToken?.decimals,
          )?.toFixed(2);

          currentData.inputTokenAmounts = inputTokensDecimal.join(", ");
          currentData.outputTokenAmount = outputTokenDecimal;
          currentData.inputTokens = currentData.inputTokens
            .map((tok: { [x: string]: any }) => {
              return tok.id;
            })
            .join(", ");
          currentData.outputToken = JSON.stringify(currentData?.outputToken?.id);
        } else if (currentData.amount) {
          currentData.amount = convertTokenDecimals(currentData.amount, data[poolName].inputTokens[0].decimals);
        }
        if (currentData?.tokenIn) {
          const amountIn = convertTokenDecimals(currentData.amountIn, currentData?.tokenIn?.decimals);
          currentData.tokenIn = currentData?.tokenIn?.id;
          currentData.amountIn = amountIn.toFixed(2);
        } else {
          currentData.tokenIn = "N/A";
          currentData.amountIn = "0";
        }
        if (currentData?.tokenOut) {
          const amountOut = convertTokenDecimals(currentData.amountOut, currentData?.tokenOut?.decimals);
          currentData.tokenOut = currentData?.tokenOut?.id;
          currentData.amountOut = amountOut.toFixed(2);
        } else {
          currentData.tokenOut = "N/A";
          currentData.amountOut = "0";
        }
        if (currentData?.reserveAmounts) {
          const reserveAmountsDecimal = currentData.reserveAmounts.map((amt: string, idx: number) => {
            return convertTokenDecimals(amt, data[poolName].inputTokens[idx].decimals).toFixed(2);
          });
          currentData.reserveAmounts = reserveAmountsDecimal.join(", ");
        }
        tableData.push({ id: `${eventName}-${i}`, date: toDate(currentData.timestamp), ...currentData });
      }
    }
    const columns = Object.keys(dataTable[0])
      .filter(function (field: string) {
        if (field.includes("typename")) {
          return false;
        }
        return true;
      })
      .map((field: string) => {
        if (field === "timestamp") {
          field = "date";
        }
        return {
          field: field,
          headerName: field,
          width: 250,
          renderCell: (params: { [x: string]: any }) => {
            let valueStr = params.value;
            if (field === "date") {
              valueStr = params.value;
            }
            let onClick = undefined;
            if (valueStr?.length > 20) {
              valueStr = `${params.value.slice(0, 10)}...${params.value.slice(
                params.value.length - 15,
                params.value.length,
              )}`;
            }
            if (!valueStr) {
              valueStr = "N/A";
            }
            const blockExplorerUrlBase = blockExplorers[protocolNetwork.toUpperCase()];
            if (blockExplorerUrlBase) {
              if (field.toUpperCase() === "HASH") {
                onClick = () => (window.location.href = blockExplorerUrlBase + "tx/" + params.value);
              }
              if (field.toUpperCase() === "FROM" || field.toUpperCase() === "TO") {
                onClick = () => (window.location.href = blockExplorerUrlBase + "address/" + params.value);
              }
            }
            if (field.toUpperCase().includes("USD")) {
              valueStr = "$" + Number(Number(params.value).toFixed(2)).toLocaleString();
            }
            return (
              <Tooltip title={params.value}>
                <span onClick={onClick} style={tableCellTruncate}>
                  {valueStr}
                </span>
              </Tooltip>
            );
          },
        };
      });

    return (
      <Box height={750} py={6} id={eventName}>
        <CopyLinkToClipboard link={window.location.href} scrollId={eventName}>
          <Typography fontSize={20}>
            <b>{datasetLabel.toUpperCase()}</b>
          </Typography>
        </CopyLinkToClipboard>
        <DataGrid
          pageSize={10}
          initialState={{
            sorting: {
              sortModel: [{ field: "timestamp", sort: "desc" }],
            },
          }}
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
