
// 🛡️ Configuración centralizada de límites por plan
// Basado en la página de precios:
// Base: 300 ops/mes, 100 productos, 1 usuario, 5 proveedores
// Gestión: 2.000 ops/mes, 5.000 productos, 2 usuarios, 25 proveedores
// Avanzado: 6.000 ops/mes, 12.000 productos, Ilimitado usuarios, Ilimitado proveedores

export const PLAN_LIMITS = {
  basic: {
    products: 100,
    suppliers: 5,
    users: 1, // Solo el dueño
    monthlySales: 500
  },
  gestion: {
    products: 5000,
    suppliers: 25,
    users: 2, // Dueño + 1 empleado
    monthlySales: 2000
  },
  avanzado: {
    products: 12000,
    suppliers: 999999, // Ilimitado (virtualmente)
    users: 999999, // Ilimitado
    monthlySales: 6000
  }
};

// Mensajes de error amigables
export const ERROR_MESSAGES = {
  products: "Has alcanzado el límite de productos para tu plan actual.",
  suppliers: "Has alcanzado el límite de proveedores para tu plan actual.",
  users: "Has alcanzado el límite de usuarios/empleados para tu plan actual.",
  monthlySales: "Has alcanzado el límite de ventas mensuales para tu plan actual."
};
