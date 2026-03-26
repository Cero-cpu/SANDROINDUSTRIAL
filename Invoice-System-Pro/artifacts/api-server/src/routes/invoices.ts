import { Router } from "express";
import { db, invoicesTable, invoiceItemsTable, clientsTable, staffTable } from "@workspace/db";
import { eq, ilike, or, and, count, isNull, sql, between } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import type { JwtPayload } from "../lib/auth.js";
import type { Request } from "express";

const router = Router();
router.use(requireAuth);

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db.execute(sql`
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1 as next_num
    FROM invoices
    WHERE invoice_number LIKE ${`SI-${year}-%`}
  `);
  const nextNum = Number((result.rows[0] as Record<string, unknown>)?.next_num ?? 1);
  return `SI-${year}-${String(nextNum).padStart(6, "0")}`;
}

function buildInvoiceWhere(query: Record<string, string | undefined>) {
  const conditions = [isNull(invoicesTable.deletedAt)];
  if (query["search"]) {
    conditions.push(
      or(
        ilike(invoicesTable.invoiceNumber, `%${query["search"]}%`),
        sql`EXISTS (SELECT 1 FROM clients c WHERE c.id = ${invoicesTable.clientId} AND c.name ILIKE ${"%" + query["search"] + "%"})`,
      )!,
    );
  }
  if (query["status"]) {
    conditions.push(eq(invoicesTable.status, query["status"] as "pending" | "paid" | "cancelled"));
  }
  if (query["dateFrom"] && query["dateTo"]) {
    conditions.push(between(invoicesTable.createdAt, new Date(query["dateFrom"]), new Date(query["dateTo"] + "T23:59:59")));
  } else if (query["dateFrom"]) {
    conditions.push(sql`${invoicesTable.createdAt} >= ${new Date(query["dateFrom"])}`);
  } else if (query["dateTo"]) {
    conditions.push(sql`${invoicesTable.createdAt} <= ${new Date(query["dateTo"] + "T23:59:59")}`);
  }
  return and(...conditions);
}

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"]) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"]) || 20));
    const offset = (page - 1) * limit;
    const whereClause = buildInvoiceWhere(req.query as Record<string, string>);

    const [totalResult, data] = await Promise.all([
      db.select({ count: count() }).from(invoicesTable).where(whereClause),
      db.query.invoicesTable.findMany({
        where: whereClause,
        with: { client: true, measuredBy: true, quotedBy: true, items: true },
        orderBy: (inv, { desc }) => [desc(inv.createdAt)],
        limit,
        offset,
      }),
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
    const authUser = (req as Request & { user?: JwtPayload }).user!;
    const { clientId, measuredById, quotedById, budgetDate, deliveryDate, paymentMethod, downPayment, notes, status, items } = req.body as Record<string, unknown>;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "At least one item is required" });
      return;
    }

    const invoiceNumber = await generateInvoiceNumber();
    const total = (items as Array<{ total: number }>).reduce((sum, item) => sum + Number(item.total ?? 0), 0);

    const result = await db.transaction(async (tx) => {
      const [invoice] = await tx.insert(invoicesTable).values({
        invoiceNumber,
        clientId: clientId ? Number(clientId) : null,
        measuredById: measuredById ? Number(measuredById) : null,
        quotedById: quotedById ? Number(quotedById) : null,
        budgetDate: budgetDate as string | null,
        deliveryDate: deliveryDate as string | null,
        paymentMethod: (paymentMethod as "50%" | "100%" | "contra_entrega") ?? "50%",
        downPayment: String(downPayment ?? 0),
        notes: notes as string,
        status: (status as "pending" | "paid" | "cancelled") ?? "pending",
        total: String(total),
        userId: authUser.userId,
      }).returning();

      await tx.insert(invoiceItemsTable).values(
        (items as Array<Record<string, unknown>>).map((item) => ({
          invoiceId: invoice.id,
          productId: item["productId"] ? Number(item["productId"]) : null,
          description: String(item["description"] ?? ""),
          quantity: String(item["quantity"] ?? 1),
          unitPrice: String(item["unitPrice"] ?? 0),
          total: String(item["total"] ?? 0),
        })),
      );

      return invoice;
    });

    const full = await db.query.invoicesTable.findFirst({
      where: eq(invoicesTable.id, result.id),
      with: { client: true, measuredBy: true, quotedBy: true, items: true },
    });
    res.status(201).json(full);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const invoice = await db.query.invoicesTable.findFirst({
      where: and(eq(invoicesTable.id, id), isNull(invoicesTable.deletedAt)),
      with: { client: true, measuredBy: true, quotedBy: true, items: true },
    });
    if (!invoice) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(invoice);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { clientId, measuredById, quotedById, budgetDate, deliveryDate, paymentMethod, downPayment, notes, status, items } = req.body as Record<string, unknown>;

    const total = Array.isArray(items)
      ? (items as Array<{ total: number }>).reduce((sum, item) => sum + Number(item.total ?? 0), 0)
      : 0;

    await db.transaction(async (tx) => {
      await tx.update(invoicesTable).set({
        clientId: clientId ? Number(clientId) : null,
        measuredById: measuredById ? Number(measuredById) : null,
        quotedById: quotedById ? Number(quotedById) : null,
        budgetDate: budgetDate as string | null,
        deliveryDate: deliveryDate as string | null,
        paymentMethod: paymentMethod as "50%" | "100%" | "contra_entrega",
        downPayment: String(downPayment ?? 0),
        notes: notes as string,
        status: status as "pending" | "paid" | "cancelled",
        total: String(total),
        updatedAt: new Date(),
      }).where(eq(invoicesTable.id, id));

      if (Array.isArray(items)) {
        await tx.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
        if (items.length > 0) {
          await tx.insert(invoiceItemsTable).values(
            (items as Array<Record<string, unknown>>).map((item) => ({
              invoiceId: id,
              productId: item["productId"] ? Number(item["productId"]) : null,
              description: String(item["description"] ?? ""),
              quantity: String(item["quantity"] ?? 1),
              unitPrice: String(item["unitPrice"] ?? 0),
              total: String(item["total"] ?? 0),
            })),
          );
        }
      }
    });

    const full = await db.query.invoicesTable.findFirst({
      where: eq(invoicesTable.id, id),
      with: { client: true, measuredBy: true, quotedBy: true, items: true },
    });
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.update(invoicesTable).set({ deletedAt: new Date() }).where(eq(invoicesTable.id, id));
    res.json({ success: true, message: "Invoice deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.body as { status?: string };
    if (!["pending", "paid", "cancelled"].includes(status ?? "")) {
      res.status(400).json({ error: "Bad Request", message: "Invalid status" });
      return;
    }
    const [invoice] = await db.update(invoicesTable)
      .set({ status: status as "pending" | "paid" | "cancelled", updatedAt: new Date() })
      .where(eq(invoicesTable.id, id))
      .returning();
    const full = await db.query.invoicesTable.findFirst({
      where: eq(invoicesTable.id, invoice.id),
      with: { client: true, measuredBy: true, quotedBy: true, items: true },
    });
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
