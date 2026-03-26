import { Router } from "express";
import { db, clientsTable } from "@workspace/db";
import { eq, ilike, or, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"]) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"]) || 20));
    const search = req.query["search"] as string | undefined;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(ilike(clientsTable.name, `%${search}%`), ilike(clientsTable.code, `%${search}%`), ilike(clientsTable.mobile, `%${search}%`))
      : undefined;

    const [totalResult, data] = await Promise.all([
      db.select({ count: count() }).from(clientsTable).where(whereClause),
      db.select().from(clientsTable).where(whereClause).orderBy(clientsTable.name).limit(limit).offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { code, name, address, city, province, country, phone, mobile } = req.body as Record<string, string>;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Name is required" });
      return;
    }
    const [client] = await db.insert(clientsTable).values({ code, name, address, city, province, country, phone, mobile }).returning();
    res.status(201).json(client);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id)).limit(1);
    if (!client) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(client);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { code, name, address, city, province, country, phone, mobile } = req.body as Record<string, string>;
    const [client] = await db.update(clientsTable).set({ code, name, address, city, province, country, phone, mobile, updatedAt: new Date() }).where(eq(clientsTable.id, id)).returning();
    if (!client) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(client);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(clientsTable).where(eq(clientsTable.id, id));
    res.json({ success: true, message: "Client deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id/invoices", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const rows = await db.query.invoicesTable.findMany({
      where: (inv, { eq, isNull }) => eq(inv.clientId, id) && isNull(inv.deletedAt) || undefined,
      with: { client: true, measuredBy: true, quotedBy: true, items: true },
      orderBy: (inv, { desc }) => [desc(inv.createdAt)],
    });
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
