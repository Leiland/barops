import { randomBytes } from "node:crypto";
import { hashPassword } from "../lib/auth/password";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

async function provision(user: { id: string; email: string; passwordHash: string | null; emailVerifiedAt: Date | null }) {
  if (user.passwordHash) return;
  const password = randomBytes(24).toString("base64url");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() } });
  console.log("Credenciales de prueba " + user.email + ": " + password);
}

const productos = [
  { sku: "AGUA-15", nombre: "Agua mineral 1,5 L", categoria: "Sin alcohol", estacion: "BARRA", precioCentavos: 250000n, stock: 30 },
  { sku: "GASEOSA", nombre: "Gaseosa", categoria: "Sin alcohol", estacion: "BARRA", precioCentavos: 300000n, stock: 24 },
  { sku: "JUGO", nombre: "Jugo natural", categoria: "Sin alcohol", estacion: "BARRA", precioCentavos: 380000n, stock: 12 },
  { sku: "CERVEZA", nombre: "Cerveza", categoria: "Con alcohol", estacion: "BARRA", precioCentavos: 450000n, stock: 36 },
  { sku: "HAMBURGUESA", nombre: "Hamburguesa clásica", categoria: "Comidas", estacion: "COCINA", precioCentavos: 950000n, stock: 20 },
  { sku: "PIZZA", nombre: "Pizza mozzarella", categoria: "Comidas", estacion: "COCINA", precioCentavos: 1200000n, stock: 12 },
  { sku: "PAPAS", nombre: "Papas fritas", categoria: "Comidas", estacion: "COCINA", precioCentavos: 650000n, stock: 18 },
  { sku: "ENSALADA", nombre: "Ensalada de la casa", categoria: "Comidas", estacion: "COCINA", precioCentavos: 780000n, stock: 10 },
] as const;

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@barops.local" },
    update: {},
    create: {
      nombre: "Admin BarOps",
      email: "admin@barops.local",
      rol: "ADMIN",
    },
  });

  const camarero = await prisma.user.upsert({
    where: { email: "camarero@barops.local" },
    update: {},
    create: {
      nombre: "Camarero Demo",
      email: "camarero@barops.local",
      rol: "CAMARERO",
    },
  });

  const cocina = await prisma.user.upsert({
    where: { email: "cocina@barops.local" },
    update: {},
    create: { nombre: "Cocina Demo", email: "cocina@barops.local", rol: "COCINA" },
  });
  await provision(admin);
  await provision(camarero);
  await provision(cocina);

  for (const [numero, capacidad] of [2, 2, 4, 4, 6].entries()) {
    await prisma.mesa.upsert({
      where: { numero: numero + 1 },
      update: {},
      create: { numero: numero + 1, capacidad },
    });
  }

  for (const nombre of ["Sin alcohol", "Con alcohol", "Comidas"]) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  for (const dato of productos) {
    const producto = await prisma.producto.upsert({
      where: { sku: dato.sku },
      update: {},
      create: {
        sku: dato.sku,
        nombre: dato.nombre,
        categoria: { connect: { nombre: dato.categoria } },
        estacion: dato.estacion,
        precioCentavos: dato.precioCentavos,
      },
    });

    const inventario = await prisma.inventario.upsert({
      where: { productoId: producto.id },
      update: {},
      create: {
        productoId: producto.id,
        cantidadActual: dato.stock,
        cantidadMinima: 5,
      },
    });

    const apertura = await prisma.movimientoStock.findFirst({
      where: { inventarioId: inventario.id, motivo: "Stock inicial" },
    });

    if (!apertura) {
      await prisma.movimientoStock.create({
        data: {
          inventarioId: inventario.id,
          tipo: "ENTRADA",
          delta: dato.stock,
          motivo: "Stock inicial",
          registradoPorId: admin.id,
        },
      });
    }
  }

  console.log("Seed listo: 3 usuarios, 5 mesas, 3 categorías, 8 productos y 8 inventarios.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
