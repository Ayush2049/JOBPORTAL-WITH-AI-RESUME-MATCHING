import express from "express";

import {
  deleteJob,
  getAllJobs,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
  getMatchedJobs,
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllJobs); // public route
router.post("/post", isAuthenticated, postJob); // protected
router.get("/getmyjobs", isAuthenticated, getMyJobs); // protected
router.put("/update/:id", isAuthenticated, updateJob); // protected
router.delete("/delete/:id", isAuthenticated, deleteJob); // protected

//🆕 NEW: Add the matched jobs route
router.get("/matched-jobs", getMatchedJobs);
router.get("/:id", getSingleJob);
export default router;
