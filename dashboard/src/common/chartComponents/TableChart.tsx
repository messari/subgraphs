import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";

export const TableChart = (_datasetLabel: string, dataTable: any, _dataLength: number) => {

  const isPercentageField = percentageFieldList.find(x => { return _datasetLabel.toUpperCase().includes(x.toUpperCase()) })
  if (dataTable) {
    const columns = [
      { field: "date", headerName: "Date", width: 150 },
      {
        field: "value",
        headerName: "Value",
        width: 150,
      },
    ];
    let suffix = '';
    if (isPercentageField) {
      suffix = '%';
    }
    const tableData = dataTable.map((val: any, i: any) => {
      return {
        id: i,
        date: toDate(val.date),
        value: val.value.toLocaleString() + suffix,
      }
    });
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