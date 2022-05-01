import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../App";

export const TableChart = (_datasetLabel: string, dataTable: any, _dataLength: number) => {
    if (dataTable) {
      const columns = [
        { field: "date", headerName: "Date", width: 150 },
        {
          field: "value",
          headerName: "Value",
          width: 150,
        },
      ];
      const tableData = dataTable.map((val: any, i: any) => ({
        id: i,
        date: toDate(val.date),
        value: val.value.toLocaleString(),
      }));
      return (
        <DataGrid
          initialState={{
            sorting: {
              sortModel: [{ field: "date", sort: "desc" }],
            },
          }}
          rows={tableData}
          columns={columns}
        />
      );
    }
    return null;
  };