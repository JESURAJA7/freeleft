import express from 'express';
import {
  getMyAssignments,
  getMyLoadAssignments,
  getAssignmentByLoad,
  updateAssignmentStatus,
  getAssignmentDetails,
  updateAssignmentNotes,
  completeAssignment,
  createLoadAssignment,
  getAssignmentStats
} from '../controllers/loadAssignmentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Get my assignments (for vehicle owners)
router.get('/my-assignments', 
  authorize('vehicle_owner'), 
  getMyAssignments
);

// Get my load assignments (for load providers)
router.get('/my-load-assignments', 
  authorize('load_provider'), 
  getMyLoadAssignments
);

// Get assignment by load ID
router.get('/load/:loadId', getAssignmentByLoad);

// Get assignment details with full population
router.get('/:assignmentId/details', getAssignmentDetails);

// Update assignment status
router.put('/:assignmentId/status', updateAssignmentStatus);

// Update assignment notes
router.put('/:assignmentId/notes', updateAssignmentNotes);

// Complete assignment
router.put('/:assignmentId/complete', completeAssignment);

// Create new load assignment (for load providers)
router.post('/', 
  authorize('load_provider'), 
  createLoadAssignment
);

// Get assignment statistics
router.get('/stats', getAssignmentStats);

export default router;