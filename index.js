import "dotenv/config";
import express from "express";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    "CSV Processor API is running. POST to /api/upload to start processing."
  );
});

app.use("/api", uploadRoutes);

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
