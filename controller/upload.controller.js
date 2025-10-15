import fs from "fs";
import { processCsvUpload } from "../service/csvProcessor.service.js";

/**
 * Handles the incoming API request to start the CSV processing.
 */
export const handleUpload = (req, res) => {
  const csvFilePath = process.env.CSV_FILE_PATH;

  if (!csvFilePath) {
    console.error("CSV_FILE_PATH not configured in .env file.");
    return res.status(500).json({
      error: "Server configuration error: CSV file path is not defined.",
    });
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`File not found at configured path: ${csvFilePath}`);
    return res
      .status(404)
      .json({ error: `File not found at path: ${csvFilePath}\n` });
  }

  try {
    res.status(202).json({
      message:
        "CSV processing started. This is a long-running task. Check the server console for progress and the final report.\n",
    });

    processCsvUpload(csvFilePath).catch((error) => {
      console.error(
        "An error occurred during background CSV processing:",
        error
      );
    });
  } catch (error) {
    console.error("Failed to initiate CSV processing:", error);
  }
};
