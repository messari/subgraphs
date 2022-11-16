import { Button, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { csvToJSONConvertor } from "../../utils";


interface UploadFileCSVProps {
    csvJSON: any;
    csvMetaData: any;
    setCsvJSON: any;
    setCsvMetaData: any;
    field: string;
    style: any;
    isEntityLevel: boolean;
}

export const UploadFileCSV = ({ csvJSON, csvMetaData, setCsvJSON, setCsvMetaData, field, style, isEntityLevel }: UploadFileCSVProps) => {
    let classStr = "MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root";
    let labelStyle: any = { margin: "1.5px 0 0 0", padding: "6px 8px 5px 8px", borderRadius: 0, border: "1px rgb(102,86,248) solid" };
    if (isEntityLevel) {
        labelStyle = { display: "block", textAlign: "left", color: "white", margin: "1.5px 0 0 0", padding: "6px 8px 5px 0", borderRadius: 0 };
    }
    const [file, setFile] = useState<any>();

    const fileReader = new FileReader();
    const handleOnChange = (e: any) => {
        setFile(e.target.files[0]);
    };

    useEffect(() => {
        try {
            if (file) {
                fileReader.onload = function (event) {
                    const text = event?.target?.result || "";
                    if (typeof (text) === 'string') {
                        const json = csvToJSONConvertor(text, isEntityLevel);
                        if (typeof json === "string") {
                            setCsvMetaData({ ...csvMetaData, columnName: "", csvError: json })
                            return;
                        }
                        setCsvJSON(json);
                        setCsvMetaData({ fileName: file.name, columnName: "", csvError: null });
                    }
                };
                fileReader.readAsText(file);
            }
        } catch (err: any) {
            console.error(err.message);
            setCsvMetaData({ fileName: "", columnName: "", csvError: err?.message })
        }
    }, [file]);

    if (csvMetaData?.csvError) {
        return (
            <Tooltip title={csvMetaData.csvError + " Click this button to remove the CSV data and this error."} placement="top" >
                <div className={classStr} style={{ ...style, textAlign: "center" }}>
                    <Button style={{ margin: "1.5px 0 0 0", padding: "6px 8px 5px 8px", borderRadius: "0", border: "1px red solid", backgroundColor: "red", color: "white" }} onClick={() => {
                        setCsvJSON(null);
                        setCsvMetaData({ fileName: "", columnName: "", csvError: null });
                        return;
                    }} >Remove CSV</Button>
                </div>
            </Tooltip>
        );
    }

    if (csvJSON) {
        return (
            <div className={classStr} style={{ ...style, textAlign: "center" }}>
                <Button style={{ margin: "1.5px 0 0 0", padding: "6px 8px 5px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", backgroundColor: "rgb(102,86,248)", color: "white" }} onClick={() => {
                    setCsvJSON(null);
                    setCsvMetaData({ fileName: "", columnName: "", csvError: null });
                    return;
                }} >Remove CSV</Button>
            </div>);
    }

    return (
        <div className={classStr} style={{ ...style, textAlign: "center" }}>
            <form>
                <label style={labelStyle} htmlFor={"csvFileInput-" + field} className={classStr}>
                    {isEntityLevel ? "Upload Entity Level CSV" : "Upload CSV"}
                </label>
                <input
                    type={"file"}
                    id={"csvFileInput-" + field}
                    accept={".csv"}
                    onChange={handleOnChange}
                />
            </form>
        </div>
    );
}