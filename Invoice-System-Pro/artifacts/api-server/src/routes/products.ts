import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, or, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"]) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"]) || 20));
    const search = req.query["search"] as string | undefined;
    const category = req.query["category"] as string | undefined;
    const activeParam = req.query["active"] as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.code, `%${search}%`)));
    }
    if (category) {
      conditions.push(eq(productsTable.category, category));
    }
    if (activeParam !== undefined) {
      conditions.push(eq(productsTable.active, activeParam === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, data] = await Promise.all([
      db.select({ count: count() }).from(productsTable).where(whereClause),
      db.select().from(productsTable).where(whereClause).orderBy(productsTable.name).limit(limit).offset(offset),
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
    const { code, name, description, unitPrice, unit, category, stock, active } = req.body as Record<string, unknown>;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Name is required" });
      return;
    }
    const [product] = await db.insert(productsTable).values({
      code: code as string,
      name: name as string,
      description: description as string,
      unitPrice: String(unitPrice ?? 0),
      unit: unit as string,
      category: category as string,
      stock: Number(stock ?? 0),
      active: active !== false,
    }).returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { code, name, description, unitPrice, unit, category, stock, active } = req.body as Record<string, unknown>;
    const [product] = await db.update(productsTable).set({
      code: code as string,
      name: name as string,
      description: description as string,
      unitPrice: String(unitPrice ?? 0),
      unit: unit as string,
      category: category as string,
      stock: Number(stock ?? 0),
      active: Boolean(active),
      updatedAt: new Date(),
    }).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
