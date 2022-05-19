import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../../utils/index";

export const MultTableChart = (val : {[label: string]: any[]}) => {
  if (val) {
    let keys = Object.keys(val);

    const columns = [{ field: "date", headerName: "Date", width: 100 }];
    Object.keys(val).forEach(e => {
      columns.push({field:e , headerName: e, width: 100 });
    });
    let  data = []
    if(keys){
      for (let index = 0; index < val[keys[0]][0].length; index++) {
        let object:any = {};
        object['id'] = index;
        object['date'] = toDate(val[keys[0]][0][index].date);
        keys.forEach((key) =>{
          object[key] = val[key][0][index].value.toLocaleString();
        })
        data.push(object);
      }
    }
      
    return (
      <DataGrid
        initialState={{
          sorting: {
            sortModel: [{ field: "date", sort: "desc" }],
          },
        }}
        rows={data}
        columns={columns}
      />
    );
  }
  return null;
};