import express from "express";
import { handleUpload } from "../controller/upload.controller.js";

const router = express.Router();

router.post("/upload", handleUpload);

export default router;
