// Mock data for demo/preview mode (when no real backend is available)
// Used for Vercel deployment so the client can see the full frontend

import type {
    User,
    Client,
    Product,
    StaffMember,
    Invoice,
    DashboardMetrics,
} from "@workspace/api-client-react";

export const DEMO_MODE = !import.meta.env.VITE_API_URL && import.meta.env.PROD;

export const mockUser: User = {
    id: 1,
    email: "admin@sandroindustrial.com",
    name: "Administrador",
    role: "admin" as any,
};

export const mockClients: Client[] = [
    { id: 1, code: "C001", name: "Juan Rodríguez", address: "C/ Las Flores #12, Santo Domingo Este", phone: "809-555-0101", mobile: "829-555-0101" },
    { id: 2, code: "C002", name: "María Pérez García", address: "Av. 27 de Febrero #45, Santiago", phone: "809-555-0202", mobile: "849-555-0202" },
    { id: 3, code: "C003", name: "Carlos Martínez", address: "Av. España #320, Santo Domingo Norte", phone: "809-555-0303", mobile: "829-555-0303" },
    { id: 4, code: "C004", name: "Ana Lucía Fernández", address: "C/ Duarte #78, La Vega", phone: "809-555-0404", mobile: "849-555-0404" },
    { id: 5, code: "C005", name: "Roberto Sánchez", address: "C/ Independencia #56, San Pedro de Macorís", phone: "809-555-0505", mobile: "829-555-0505" },
];

export const mockProducts: Product[] = [
    { id: 1, code: "P001", name: "Ventana Corrediza 1.2m x 1.0m", description: "Aluminio anodizado natural", unitPrice: 8500, unit: "unidad", category: "Ventanas", stock: 15, active: true },
    { id: 2, code: "P002", name: "Ventana Proyectada 0.8m x 0.6m", description: "Aluminio blanco con cristal claro", unitPrice: 5200, unit: "unidad", category: "Ventanas", stock: 20, active: true },
    { id: 3, code: "P003", name: "Puerta Corrediza 2.4m x 2.1m", description: "Doble panel aluminio natural", unitPrice: 22000, unit: "unidad", category: "Puertas", stock: 5, active: true },
    { id: 4, code: "P004", name: "Closet Empotrado 3m", description: "Puertas corredizas con espejo", unitPrice: 35000, unit: "unidad", category: "Closets", stock: 3, active: true },
    { id: 5, code: "P005", name: "División de Sheetrock (m²)", description: "Incluye estructura y acabado", unitPrice: 1800, unit: "m²", category: "Sheetrock", stock: 100, active: true },
    { id: 6, code: "P006", name: "Cielo Raso Sheetrock (m²)", description: "Con moldura perimetral", unitPrice: 2200, unit: "m²", category: "Sheetrock", stock: 80, active: true },
    { id: 7, code: "P007", name: "Puerta Abatible 0.9m x 2.1m", description: "Aluminio natural con cristal", unitPrice: 12500, unit: "unidad", category: "Puertas", stock: 8, active: true },
    { id: 8, code: "P008", name: "Mosquitero Corredizo", description: "Malla fibra de vidrio", unitPrice: 3500, unit: "unidad", category: "Accesorios", stock: 25, active: true },
];

export const mockStaff: StaffMember[] = [
    { id: 1, name: "Pedro Jiménez", role: "measurer" as any, active: true },
    { id: 2, name: "Luis Ramírez", role: "quoter" as any, active: true },
    { id: 3, name: "Miguel Ángel Torres", role: "both" as any, active: true },
];

export const mockInvoices: Invoice[] = [
    {
        id: 1,
        invoiceNumber: "SI-2026-0001",
        createdAt: "2026-03-01T10:00:00Z",
        clientId: 1,
        client: mockClients[0],
        measuredById: 1,
        measuredBy: mockStaff[0],
        quotedById: 2,
        quotedBy: mockStaff[1],
        budgetDate: "2026-03-01",
        deliveryDate: "20 de Marzo 2026",
        paymentMethod: "50%" as any,
        downPayment: 22750,
        notes: "Cliente solicita cristal tintado en todas las ventanas",
        status: "paid" as any,
        items: [
            { id: 1, productId: 1, description: "Ventana Corrediza 1.2m x 1.0m - Aluminio anodizado natural", quantity: 3, unitPrice: 8500, total: 25500 },
            { id: 2, productId: 3, description: "Puerta Corrediza 2.4m x 2.1m - Doble panel aluminio natural", quantity: 1, unitPrice: 22000, total: 22000 },
        ],
        total: 47500,
    },
    {
        id: 2,
        invoiceNumber: "SI-2026-0002",
        createdAt: "2026-03-05T14:30:00Z",
        clientId: 2,
        client: mockClients[1],
        measuredById: 3,
        measuredBy: mockStaff[2],
        quotedById: 2,
        quotedBy: mockStaff[1],
        budgetDate: "2026-03-05",
        deliveryDate: "25 de Marzo 2026",
        paymentMethod: "50%" as any,
        downPayment: 17500,
        notes: "",
        status: "pending" as any,
        items: [
            { id: 3, productId: 4, description: "Closet Empotrado 3m - Puertas corredizas con espejo", quantity: 1, unitPrice: 35000, total: 35000 },
        ],
        total: 35000,
    },
    {
        id: 3,
        invoiceNumber: "SI-2026-0003",
        createdAt: "2026-03-10T09:15:00Z",
        clientId: 3,
        client: mockClients[2],
        measuredById: 1,
        measuredBy: mockStaff[0],
        quotedById: 2,
        quotedBy: mockStaff[1],
        budgetDate: "2026-03-10",
        deliveryDate: "5 de Abril 2026",
        paymentMethod: "contra_entrega" as any,
        downPayment: 0,
        notes: "Proyecto completo de remodelación de oficina",
        status: "pending" as any,
        items: [
            { id: 4, productId: 5, description: "División de Sheetrock (m²) - Incluye estructura y acabado", quantity: 24, unitPrice: 1800, total: 43200 },
            { id: 5, productId: 6, description: "Cielo Raso Sheetrock (m²) - Con moldura perimetral", quantity: 18, unitPrice: 2200, total: 39600 },
            { id: 6, productId: 2, description: "Ventana Proyectada 0.8m x 0.6m - Aluminio blanco con cristal claro", quantity: 4, unitPrice: 5200, total: 20800 },
        ],
        total: 103600,
    },
    {
        id: 4,
        invoiceNumber: "SI-2026-0004",
        createdAt: "2026-03-15T16:00:00Z",
        clientId: 4,
        client: mockClients[3],
        measuredById: 3,
        measuredBy: mockStaff[2],
        quotedById: 3,
        quotedBy: mockStaff[2],
        budgetDate: "2026-03-15",
        deliveryDate: "10 de Abril 2026",
        paymentMethod: "100%" as any,
        downPayment: 62500,
        notes: "",
        status: "paid" as any,
        items: [
            { id: 7, productId: 7, description: "Puerta Abatible 0.9m x 2.1m - Aluminio natural con cristal", quantity: 2, unitPrice: 12500, total: 25000 },
            { id: 8, productId: 1, description: "Ventana Corrediza 1.2m x 1.0m - Aluminio anodizado natural", quantity: 2, unitPrice: 8500, total: 17000 },
            { id: 9, productId: 8, description: "Mosquitero Corredizo - Malla fibra de vidrio", quantity: 4, unitPrice: 3500, total: 14000 },
            { id: 10, productId: 5, description: "División de Sheetrock (m²)", quantity: 6, unitPrice: 1800, total: 10800 },
        ],
        total: 66800,
    },
    {
        id: 5,
        invoiceNumber: "SI-2026-0005",
        createdAt: "2026-03-20T11:45:00Z",
        clientId: 5,
        client: mockClients[4],
        measuredById: 1,
        measuredBy: mockStaff[0],
        quotedById: 2,
        quotedBy: mockStaff[1],
        budgetDate: "2026-03-20",
        deliveryDate: "15 de Abril 2026",
        paymentMethod: "50%" as any,
        downPayment: 0,
        notes: "Incluye instalación y transporte",
        status: "cancelled" as any,
        items: [
            { id: 11, productId: 4, description: "Closet Empotrado 3m - Puertas corredizas con espejo", quantity: 2, unitPrice: 35000, total: 70000 },
        ],
        total: 70000,
    },
];

export const mockDashboardMetrics: DashboardMetrics = {
    monthInvoices: 5,
    monthRevenue: 322900,
    pendingInvoices: 2,
    paidInvoices: 2,
    monthlyRevenue: [
        { month: "2025-10", total: 185000, count: 3 },
        { month: "2025-11", total: 245000, count: 4 },
        { month: "2025-12", total: 312000, count: 5 },
        { month: "2026-01", total: 198000, count: 3 },
        { month: "2026-02", total: 267000, count: 4 },
        { month: "2026-03", total: 322900, count: 5 },
    ],
    recentInvoices: mockInvoices.slice(0, 5),
};

// Generate a fake JWT token for demo mode
export function generateDemoToken(): string {
    // This is a demo-only token (not cryptographically valid)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
        userId: 1,
        email: "admin@sandroindustrial.com",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    }));
    const signature = btoa("demo-signature-not-real");
    return `${header}.${payload}.${signature}`;
}
