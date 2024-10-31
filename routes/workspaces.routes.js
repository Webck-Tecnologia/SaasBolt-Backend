import express from "express";
import { isAuthenticate } from "../middleware/verifyToken.js"
import { 
    getUserWorkspaces, 
    getUserActiveWorkspaces, 
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace,
    getWorkspaceModules,
    addWorkspaceModule,
    updateWorkspaceModule,
    deleteWorkspaceModule,
    joinWorkspaceByInviteCode
} from "../controllers/workspaces.controller.js"

const router = express.Router();

router.get("/", isAuthenticate, getUserWorkspaces);
router.get("/active", isAuthenticate, getUserActiveWorkspaces);
router.post("/", isAuthenticate, createWorkspace);
router.put("/:id", isAuthenticate, updateWorkspace);
router.delete("/:id", isAuthenticate, deleteWorkspace);

// Rotas para módulos do workspace
router.get("/:id/modules", isAuthenticate, getWorkspaceModules);
router.post("/:id/modules", isAuthenticate, addWorkspaceModule);
router.put("/:id/modules/:moduleId", isAuthenticate, updateWorkspaceModule);
router.delete("/:id/modules/:moduleId", isAuthenticate, deleteWorkspaceModule);

router.post("/join", isAuthenticate, joinWorkspaceByInviteCode);

export default router;
