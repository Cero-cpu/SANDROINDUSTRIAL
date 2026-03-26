import { Router } from "express";
import { db, invoicesTable } from "@workspace/db";
import { isNull, eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/metrics", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [monthStats, statusStats, monthlyRevenue, recentInvoices] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*) as count, COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue
        FROM invoices
        WHERE deleted_at IS NULL
          AND created_at >= ${startOfMonth}
          AND created_at <= ${endOfMonth}
      `),
      db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM invoices
        WHERE deleted_at IS NULL
        GROUP BY status
      `),
      db.execute(sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month_name,
          COALESCE(SUM(CAST(total AS DECIMAL)), 0) as total,
          COUNT(*) as count
        FROM invoices
        WHERE deleted_at IS NULL
          AND status != 'cancelled'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `),
      db.query.invoicesTable.findMany({
        where: isNull(invoicesTable.deletedAt),
        with: { client: true, measuredBy: true, quotedBy: true, items: true },
        orderBy: (inv, { desc }) => [desc(inv.createdAt)],
        limit: 5,
      }),
    ]);

    const monthRow = monthStats.rows[0] as Record<string, unknown>;
    const statusRows = statusStats.rows as Array<Record<string, unknown>>;

    const pendingCount = Number(statusRows.find((r) => r["status"] === "pending")?.["count"] ?? 0);
    const paidCount = Number(statusRows.find((r) => r["status"] === "paid")?.["count"] ?? 0);

    const monthly = (monthlyRevenue.rows as Array<Record<string, unknown>>).map((r) => ({
      month: String(r["month_name"]),
      total: Number(r["total"]),
      count: Number(r["count"]),
    }));

    res.json({
      monthInvoices: Number(monthRow["count"] ?? 0),
      monthRevenue: Number(monthRow["revenue"] ?? 0),
      pendingInvoices: pendingCount,
      paidInvoices: paidCount,
      monthlyRevenue: monthly,
      recentInvoices,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
