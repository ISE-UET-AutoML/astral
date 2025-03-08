import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "#src/config/config.js";
import AdmZip from "adm-zip";
import unzipper from "unzipper";

const s3Client = config.s3Client;
const s3BucketName = config.s3BucketName;

/**
 *
 * @param {string} objectName - Name of the object
 * @param {string || Buffer} files - Files need to zip
 */
const uploadZippedFiles = async (objectName, files) => {
  // 1. Zip the files
  const zip = new AdmZip();

  if (Array.isArray(files)) {
    for (const file of files) {
      zip.addFile(file.name, file.data);
    }
  } else {
    zip.addFile(files.name, files.data);
  }

  const zipBuffer = zip.toBuffer();
  console.log(
    `Zipped ${files.length} files into a buffer of size ${zipBuffer.length} bytes.`
  );

  // 2. Upload the zipped file to S3 using the Upload operation
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: s3BucketName,
      Key: `${objectName}.zip`,
      Body: zipBuffer,
      ContentType: "application/zip",
    },
  });

  try {
    await parallelUploads3.done();
    console.log("Upload to S3 completed successfully.");
  } catch (err) {
    console.error("Error uploading to S3:", err);
    // Add error handling logic here
  }
};

/**
 *
 * @param {string} bucketName - Name of the bucket
 * @param {string} objectName - Name of the object
 * @returns {Promise<Array<{fileName: string, content: Buffer}>>} - An array of objects representing files with their content
 */
const getDataset = async (bucketName, objectName) => {
  const extractedFiles = [];

  try {
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: `${objectName}.zip`,
    });
    const response = await s3Client.send(command);

    // Check if response.Body is a stream
    if (response.Body) {
      return new Promise((resolve, reject) => {
        response.Body.pipe(unzipper.Parse())
          .on("entry", function (entry) {
            const fileName = entry.path;
            const type = entry.type; // 'File'

            if (type === "File") {
              entry
                .buffer()
                .then((buffer) => {
                  extractedFiles.push({
                    fileName,
                    content: Buffer.from(buffer),
                    encoding: "utf8",
                  });
                  entry.autodrain(); // Ensure stream continues processing
                })
                .catch((err) => {
                  console.error("Error processing file:", err);
                  reject(err);
                });
            } else {
              // Skip directories
              entry.autodrain();
            }
          })
          .on("close", () => {
            resolve(extractedFiles); // Resolve with the extracted files when done
          })
          .on("error", (err) => {
            console.error("Error extracting zip file:", err);
            reject(err);
          });
      });
    } else {
      throw new Error("Did not receive a valid response from S3");
    }
  } catch (error) {
    console.error("Error while fetching data from S3:", error);
    throw error;
  }
};

/**
 *
 * @param {string} objectName name of the object
 */
const getPresignedURL = async (objectName) => {
  const command = new GetObjectCommand({
    Bucket: s3BucketName,
    Key: `${objectName}.zip`,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("Presigned URL For GET Data from S3:", url);
    return url;
  } catch (error) {
    console.error("Error generating presigned URL", error);
  }
};

const CloudStorageService = {
  uploadZippedFiles,
  getDataset,
  getPresignedURL,
};

export default CloudStorageService;
