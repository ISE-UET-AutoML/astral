import Papa from "papaparse";
import fs from "fs";
import config from "#src/config/config.js";

const extractDataFromCSV = async (csvFileUrl, rowIndexes, projectName) => {
  if (typeof rowIndexes === "string") {
    rowIndexes = rowIndexes.split(",");
    rowIndexes = rowIndexes.map((item) => parseInt(item));
  }

  if (!Array.isArray(rowIndexes)) {
    rowIndexes = [rowIndexes];
  }

  console.log(rowIndexes);

  const csvFileName = csvFileUrl.split("/").pop();

  const csvFilePath = `public/media/upload/${projectName}/${csvFileName}`;

  console.log(csvFilePath);

  // Wrap readFile and PapaParse in a Promise
  return new Promise((resolve, reject) => {
    fs.readFile(csvFilePath, "utf8", (err, csvData) => {
      if (err) {
        console.log("Error reading file");
        reject("Error reading the CSV file");
        return;
      }

      // Parse the CSV data using PapaParse
      Papa.parse(csvData, {
        header: true,
        complete: function (results) {
          const data = results.data;

          // Extract the header and the rows based on the provided indexes
          const headers = Object.keys(data[0]);
          console.log(headers);
          const tempData = rowIndexes.map((el) => Object.values(data[el]));
          // Combine header and extracted rows
          const newCSVData = [headers, ...tempData];

          // Convert back to CSV
          const csv = Papa.unparse(newCSVData, {
            quotes: false,
          });

          // Write the new CSV to a temporary file
          const saveFilePath = `public/media/upload/${projectName}/extracted_${csvFileName}`;
          fs.writeFile(saveFilePath, csv, (err) => {
            if (err) {
              console.log("Error saving file");
              reject("Error saving the extracted CSV file");
            } else {
              console.log("File saved successfully");
              const tempFilePath =
                `http://${config.hostIP}:${config.port}/${saveFilePath}`.replace(
                  "public/",
                  ""
                );
              resolve(tempFilePath); // Resolve the promise with the file path
            }
          });
        },
        error: function (error) {
          reject(error); // Reject if PapaParse fails
        },
      });
    });
  });
};

export { extractDataFromCSV };
