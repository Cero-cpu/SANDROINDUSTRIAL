import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const staff = await db.select().from(staffTable).orderBy(staffTable.name);
    res.json(staff);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, role, active } = req.body as Record<string, unknown>;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Name is required" });
      return;
    }
    const [member] = await db.insert(staffTable).values({
      name: name as string,
      role: (role as "measurer" | "quoter" | "both") ?? "both",
      active: active !== false,
    }).returning();
    res.status(201).json(member);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { name, role, active } = req.body as Record<string, unknown>;
    const [member] = await db.update(staffTable).set({
      name: name as string,
      role: role as "measurer" | "quoter" | "both",
      active: Boolean(active),
      updatedAt: new Date(),
    }).where(eq(staffTable.id, id)).returning();
    if (!member) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(member);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(staffTable).where(eq(staffTable.id, id));
    res.json({ success: true, message: "Staff member deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
