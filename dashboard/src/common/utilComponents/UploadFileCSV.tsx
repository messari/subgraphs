import { Button, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { csvToJSONConvertor } from "../../utils";


interface UploadFileCSVProps {
    csvJSON: any;
    csvMetaData: any;
    setCsvJSON: any;
    setChartIsImage: any;
    setCsvMetaData: any;
    field: string;
}

export const UploadFileCSV = ({ csvJSON, csvMetaData, setCsvJSON, setChartIsImage, setCsvMetaData, field }: UploadFileCSVProps) => {
    const classStr = "MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root";
    const [file, setFile] = useState<any>();

    const fileReader = new FileReader();
    const handleOnChange = (e: any) => {
        setFile(e.target.files[0]);
    };

    useEffect(() => {
        try {
            setChartIsImage(false);
            if (file) {
                fileReader.onload = function (event) {
                    const text = event?.target?.result || "";
                    if (typeof (text) === 'string') {
                        const json = csvToJSONConvertor(text);
                        if (typeof json === "string") {
                            setCsvMetaData({ ...csvMetaData, csvError: json })
                            return;
                        }
                        setCsvJSON(json);
                        setCsvMetaData({ fileName: file.name, csvError: null });
                    }
                };
                fileReader.readAsText(file);
            }
        } catch (err: any) {
            console.error(err.message);
            setCsvMetaData({ ...csvMetaData, csvError: err?.message })
        }
    }, [file]);

    if (csvMetaData?.csvError) {
        return (
            <Tooltip title={csvMetaData.csvError + " Click this button to remove the CSV data and this error."} placement="top" >
                <div className={classStr} style={{ textAlign: "center" }}>
                    <Button style={{ padding: "1px 8px", borderRadius: "0", border: "1px red solid", backgroundColor: "red", color: "white" }} onClick={() => {
                        setCsvJSON(null);
                        setCsvMetaData({ ...csvMetaData, csvError: null });
                        setChartIsImage(false);
                        return;
                    }} >Remove CSV</Button>
                </div>
            </Tooltip>
        );
    }

    if (csvJSON) {
        return (
            <div className={classStr} style={{ textAlign: "center" }}>
                <Button style={{ padding: "1px 8px", borderRadius: "0", border: "1px rgb(102,86,248) solid", backgroundColor: "rgb(102,86,248)", color: "white" }} onClick={() => {
                    setCsvJSON(null);
                    setChartIsImage(false);
                    return;
                }} >Remove CSV</Button>
            </div>);
    }

    return (
        <div className={classStr} style={{ textAlign: "center" }}>
            <form>
                <label style={{ borderRadius: 0, border: "1px rgb(102,86,248) solid", padding: "1px 8px" }} htmlFor={"csvFileInput-" + field} className={classStr}>
                    Upload CSV
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