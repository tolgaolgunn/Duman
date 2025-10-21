import express from "express";

import { register } from "../Auth/registerController.js";

const router = express.Router();
router.post("/register", register);
// router.post("/login", loginUser);
// router.get("/profile", getProfile); 

export default router;
