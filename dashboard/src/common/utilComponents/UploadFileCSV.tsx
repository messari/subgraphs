import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { csvToJSONConvertor } from "../../utils";


interface ComparisonTableProps {
    csvJSON: any;
    setCsvJSON: any;
}

export const UploadFileCSV = ({ csvJSON, setCsvJSON }: ComparisonTableProps) => {
    const [file, setFile] = useState<any>();

    const fileReader = new FileReader();

    const handleOnChange = (e: any) => {
        setFile(e.target.files[0]);
    };

    useEffect(() => {
        if (file) {
            fileReader.onload = function (event) {
                const text = event?.target?.result || "";
                if (typeof (text) === 'string') {
                    const json = csvToJSONConvertor(text);
                    setCsvJSON(json);
                }
            };

            fileReader.readAsText(file);
        }
    }, [file]);

    if (csvJSON) {
        return (
            <div style={{ textAlign: "center" }}>
                <Button onClick={() => setCsvJSON(null)} >Clear CSV</Button>
            </div>);
    }

    return (
        <div style={{ textAlign: "center" }}>
            <form>
                <input
                    type={"file"}
                    id={"csvFileInput"}
                    accept={".csv"}
                    onChange={handleOnChange}
                />
            </form>
        </div>
    );
}