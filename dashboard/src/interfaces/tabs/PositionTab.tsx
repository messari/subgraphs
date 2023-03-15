import { Box, CircularProgress } from "@mui/material";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { DataGrid } from "@mui/x-data-grid";

interface PositionTabProps {
  positions: any[];
  poolId: string;
  poolsList: { [x: string]: any[] };
  poolListLoading: any;
  poolNames: string;
  poolsListError: any;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
}

export default function PositionTab({
  positions,
  poolId,
  poolsList,
  poolNames,
  poolListLoading,
  poolsListError,
  setPoolId,
}: PositionTabProps) {
  let poolDropDown = null;
  if (poolsList) {
    poolDropDown = (
      <PoolDropDown
        poolId={poolId}
        pools={poolsList[poolNames]}
        setPoolId={(x) => setPoolId(x)}
      />
    );
  } else if (poolListLoading) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  let positionsData = null;
  if (!positions?.length) {
    positionsData = <div>{poolId ? "No positions for this pool" : ""}</div>;
  } else {
    const columns = Object.keys(positions[0])
      .filter((key) => {
        if (key.includes("typename")) {
          return false;
        }
        return true;
      })
      .map((key) => {
        return {
          field: key,
          headerName: key,
          width: 250,
          renderCell: (params: any) => {
            let valueStr =
              params.value === null ? "-" : typeof params.value === "boolean" ? `${params.value}` : params.value;
            if (key === "account") {
              valueStr = valueStr.id;
            }

            const relatedEvents = ["liquidations", "borrows", "withdraws", "repays", "deposits"];
            if (relatedEvents.includes(key)) {
              valueStr = valueStr.map((val: any) => val.hash).join(",");
            }
            if (key === "date") {
              valueStr = params.value;
            }
            let url = undefined;
            if (typeof valueStr === "string" && valueStr.length > 20) {
              const tempStr = valueStr;
              valueStr = `${valueStr.slice(0, 10)}...${valueStr.slice(valueStr.length - 15, valueStr.length)}`;

              const getBaseUrl = () => {
                if (key === "id") {
                  return;
                }
                if (key.toUpperCase().includes("HASH") || relatedEvents.includes(key)) {
                  return "https://etherscan.io/tx/";
                }
                if (key.toUpperCase().includes("ACCOUNT")) {
                  return "https://etherscan.io/address/";
                }
              };
              const baseUrl = getBaseUrl();
              if (baseUrl) {
                url = baseUrl + tempStr;
              }
            }
            if (key.toUpperCase().includes("USD")) {
              valueStr = "$" + Number(Number(params.value).toFixed(2)).toLocaleString();
            }
            return (
              <span>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "initial" }}>
                    {valueStr}
                  </a>
                ) : (
                  valueStr
                )}
              </span>
            );
          },
        };
      });
    positionsData = (
      <Box sx={{ height: 750, width: "100%" }}>
        <DataGrid
          pageSize={10}
          initialState={{
            sorting: {
              sortModel: [{ field: "timestamp", sort: "desc" }],
            },
          }}
          rows={positions}
          columns={columns}
        />
      </Box>
    );
  }

  return (
    <>
      {poolDropDown}
      {positionsData}
    </>
  );
}
