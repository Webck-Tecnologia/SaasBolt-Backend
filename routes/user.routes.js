import express from "express";
import { isAuthenticate } from "../middleware/verifyToken.js"
import { 
    getUsers, 
    getUserForSidebar, 
    createUser, 
    updateUser, 
    setActiveWorkspace, 
    getUserWorkspaces, 
    getActiveWorkspace, 
    getUserDetails
} from "../controllers/user.controller.js"

const router = express.Router();

router.get("/workspace/:workspaceId", isAuthenticate, getUsers);
router.get("/sidebar", isAuthenticate, getUserForSidebar);
router.post("/", isAuthenticate, createUser);
router.put("/", isAuthenticate, updateUser);
router.put("/active-workspace", isAuthenticate, setActiveWorkspace);
router.get("/workspaces", isAuthenticate, getUserWorkspaces);
router.get("/active-workspace", isAuthenticate, getActiveWorkspace);
router.get("/me", isAuthenticate, getUserDetails);

export default router;
