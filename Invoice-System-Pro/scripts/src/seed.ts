import { db, usersTable, clientsTable, productsTable, staffTable, invoicesTable, invoiceItemsTable } from "@workspace/db";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return "$2b$10$" + createHash("sha256").update(password).digest("hex").substring(0, 53);
}

async function seed() {
  console.log("🌱 Seeding database...");

  const [admin] = await db.insert(usersTable).values({
    email: "admin@sandroindustrial.com",
    name: "Administrador",
    passwordHash: "$2b$10$L3kf4tcx7UOeVf5H67dke.yORI3Q1cXmVHF5idWVqSXx53KabHUWe",
    role: "admin",
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { passwordHash: "$2b$10$L3kf4tcx7UOeVf5H67dke.yORI3Q1cXmVHF5idWVqSXx53KabHUWe" }
  }).returning();
  console.log("✅ Admin user created (or already exists)");

  const staffMembers = await db.insert(staffTable).values([
    { name: "Sandro Santos", role: "both", active: true },
    { name: "Pedro Ramírez", role: "measurer", active: true },
    { name: "María González", role: "quoter", active: true },
  ]).onConflictDoNothing().returning();
  console.log("✅ Staff members seeded:", staffMembers.length);

  const clients = await db.insert(clientsTable).values([
    { code: "2461", name: "Aurelio Lopez", address: "C/ Los Guallabitos Frente Col. Manuel", city: "Bonao", province: "Monseñor Nouel", country: "República Dominicana", phone: "", mobile: "849-268-1238" },
    { code: "2462", name: "Carlos Martínez", address: "Av. Independencia #45", city: "Santiago", province: "Santiago", country: "República Dominicana", phone: "809-555-0001", mobile: "849-555-0001" },
    { code: "2463", name: "Ana Rodríguez", address: "C/ El Conde #12", city: "Santo Domingo", province: "Distrito Nacional", country: "República Dominicana", phone: "", mobile: "849-555-0002" },
  ]).onConflictDoNothing().returning();
  console.log("✅ Clients seeded:", clients.length);

  const products = await db.insert(productsTable).values([
    { code: "VEN-001", name: "Ventana Corrediza Aluminio Blanco", description: "Ventana corrediza de aluminio blanco con cristal claro", unitPrice: "8500.00", unit: "m²", category: "Ventanas", active: true },
    { code: "VEN-002", name: "Ventana Corrediza con Cristal Martillado Bronce", description: "Ventana corrediza con cristal martillado color bronce", unitPrice: "11000.00", unit: "m²", category: "Ventanas", active: true },
    { code: "PUE-001", name: "Puerta de Metal Industrial", description: "Puerta metálica para uso industrial, reforzada", unitPrice: "15000.00", unit: "unidad", category: "Puertas", active: true },
    { code: "CLO-001", name: "Closet Aluminio y Cristal", description: "Closet completo en aluminio y cristal templado", unitPrice: "35000.00", unit: "m²", category: "Closets", active: true },
    { code: "COC-001", name: "Gabinete Cocina Aluminio", description: "Gabinete de cocina en aluminio y cristal para despensa", unitPrice: "45000.00", unit: "m²", category: "Cocinas", active: true },
    { code: "TOL-001", name: "Toldo Retráctil", description: "Toldo retráctil con lona reforzada", unitPrice: "12000.00", unit: "m²", category: "Toldos", active: true },
    { code: "PLA-001", name: "Plafón PVC", description: "Plafón de PVC para interiores", unitPrice: "350.00", unit: "m²", category: "Plafones", active: true },
  ]).onConflictDoNothing().returning();
  console.log("✅ Products seeded:", products.length);

  const existing = await db.select().from(invoicesTable).limit(1);
  if (existing.length === 0) {
    const allClients = await db.select().from(clientsTable).limit(1);
    const allStaff = await db.select().from(staffTable).limit(1);
    const allUsers = await db.select().from(usersTable).limit(1);

    if (allClients[0] && allStaff[0] && allUsers[0]) {
      const invoiceNumber = `SI-${new Date().getFullYear()}-000001`;
      const [inv] = await db.insert(invoicesTable).values({
        invoiceNumber,
        clientId: allClients[0].id,
        measuredById: allStaff[0].id,
        quotedById: allStaff[0].id,
        deliveryDate: "2026-03-13",
        paymentMethod: "50%",
        downPayment: "11000.00",
        status: "pending",
        total: "11000.00",
        userId: allUsers[0].id,
      }).returning();

      await db.insert(invoiceItemsTable).values({
        invoiceId: inv.id,
        description: "Correderas blancas con cristal Martillado bronce",
        quantity: "3",
        unitPrice: "3666.67",
        total: "11000.00",
      });
      console.log("✅ Sample invoice seeded:", invoiceNumber);
    }
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
