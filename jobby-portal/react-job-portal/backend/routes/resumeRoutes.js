import express from 'express';
import {
  storeResumeAndMatch,
  getMatchResults,
  getUserMatches,
  getJobMatches
} from '../controllers/resumeController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();
router.post('/resume/match-public', storeResumeAndMatch);
// Remove isAuthenticated from this route
router.post('/resume/match', storeResumeAndMatch);

// Keep authentication on other routes if you want
router.get('/resume/match/:userId/:jobId', getMatchResults);
router.get('/resume/user-matches/:userId', getUserMatches);
router.get('/resume/job-matches/:jobId', getJobMatches);

export default router;