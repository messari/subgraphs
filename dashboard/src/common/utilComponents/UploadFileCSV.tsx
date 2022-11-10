import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { csvToJSONConvertor } from "../../utils";


interface UploadFileCSVProps {
    csvJSON: any;
    setCsvJSON: any;
    setChartIsImage: any;
    setCsvMetaData: any;
    field: string;
}

export const UploadFileCSV = ({ csvJSON, setCsvJSON, setChartIsImage, setCsvMetaData, field }: UploadFileCSVProps) => {
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
                        setCsvJSON(json);
                        setCsvMetaData({ fileName: file.name });
                    }
                };
                fileReader.readAsText(file);
            }
        } catch (err: any) {
            console.error(err.message);
        }
    }, [file]);

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