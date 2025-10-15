import fs from "fs";
import readline from "readline";
import { getPool } from "../config/db.config.js";
import { createNestedObject } from "../utils/json.utility.js";
import { generateAgeDistributionReport } from "./report.service.js";

// Define the batch size for database insertions to manage memory and performance.
const BATCH_SIZE = 1000;

/**
 * Main function to process the CSV file. It streams the file line-by-line,
 * transforms the data, and inserts it into the database in batches.
 * @param {string} filePath - The path to the CSV file.
 */
export const processCsvUpload = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let isFirstLine = true;
  let recordsBatch = [];
  let totalRecordsProcessed = 0;

  console.log("Starting CSV processing...");

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(",").map((h) => h.trim());
      isFirstLine = false;
      continue;
    }

    const values = line.split(",");
    const flatObject = headers.reduce((obj, header, index) => {
      obj[header] = values[index] ? values[index].trim() : "";
      return obj;
    }, {});

    const nestedObject = createNestedObject(flatObject);
    const dbRecord = transformToDbSchema(nestedObject);

    recordsBatch.push(dbRecord);

    if (recordsBatch.length >= BATCH_SIZE) {
      await insertBatch(recordsBatch);
      totalRecordsProcessed += recordsBatch.length;
      console.log(
        `Inserted batch. Total records processed: ${totalRecordsProcessed}`
      );
      recordsBatch = [];
    }
  }

  if (recordsBatch.length > 0) {
    await insertBatch(recordsBatch);
    totalRecordsProcessed += recordsBatch.length;
    console.log(
      `Inserted final batch. Total records processed: ${totalRecordsProcessed}`
    );
  }

  console.log("\n--- CSV processing complete. ---");

  await generateAgeDistributionReport();
};

/**
 * Transforms a nested JSON object into the structure required by the 'users' table.
 * @param {object} data - The nested object from a CSV row.
 * @returns {object} - An object ready for database insertion.
 */
const transformToDbSchema = (data) => {
  const { name = {}, age, address = {}, ...rest } = data;
  const additional_info = rest;

  return {
    name: `${name.firstName || ""} ${name.lastName || ""}`.trim(),
    age: parseInt(age, 10) || null,
    address: address,
    additional_info,
  };
};

/**
 * Inserts an array of records into the database using a single transaction.
 * @param {Array<object>} batch - An array of records to insert.
 */
const insertBatch = async (batch) => {
  if (batch.length === 0) return;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const queryText = `
      INSERT INTO public.users (name, age, address, additional_info)
      VALUES ($1, $2, $3, $4)
    `;

    for (const record of batch) {
      const values = [
        record.name,
        record.age,
        record.address,
        record.additional_info,
      ];
      await client.query(queryText, values);
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error during batch insert. Rolling back transaction.\n", e);
    throw e;
  } finally {
    client.release();
  }
};
