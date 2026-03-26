import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import clientsRouter from "./clients.js";
import productsRouter from "./products.js";
import staffRouter from "./staff.js";
import invoicesRouter from "./invoices.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/products", productsRouter);
router.use("/staff", staffRouter);
router.use("/invoices", invoicesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
