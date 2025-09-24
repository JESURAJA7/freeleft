import express from "express";
import {
  getDashboardStats,
  getUsers,
  approveUser,
  rejectUser,
  getLoads,
  getVehicles,
  approveVehicle,
  rejectVehicle,
  matchLoadsWithVehicles,
  getAdminSettings,
  updateAdminSettings,
  getPODs,
  approvePOD,
  rejectPOD,
  getPayments,
  getCommissionReports,
  generateReport,
  toggleUserAccess,
    registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
// router.use(protect);
// router.use(authorize("admin"));

// Admin registration and login
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.put("/change-password", changePassword);

// Dashboard
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getUsers);
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/reject", rejectUser);
router.put("/users/:id/toggle-access", toggleUserAccess);

// Load management
router.get("/loads", getLoads);
router.post("/match-loads", matchLoadsWithVehicles);

// Vehicle management
router.get("/vehicles", getVehicles);
router.put("/vehicles/:id/approve", approveVehicle);
router.put("/vehicles/:id/reject", rejectVehicle);

// POD management
router.get("/pods", getPODs);
router.put("/pods/:id/approve", approvePOD);
router.put("/pods/:id/reject", rejectPOD);

// Payment management
router.get("/payments", getPayments);

// Commission management
router.get("/commission", getCommissionReports);

// Settings
router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

// Reports
router.get("/reports/:type", generateReport);

export default router;
