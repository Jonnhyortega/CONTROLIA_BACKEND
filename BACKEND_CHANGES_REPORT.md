# Reporte de Cambios en Backend - Historial de Pagos

Se han implementado los cambios solicitados para manejar el historial de pagos de Clientes y Proveedores.

## 1. Nuevo Modelo: `Transaction`
Se creó un modelo unificado para registrar pagos tanto de clientes como a proveedores.

**Campos principales:**
- `type`: "CLIENT_PAYMENT" | "SUPPLIER_PAYMENT"
- `amount`: Number
- `client`: ObjectId (Referencia a Client, requerido si es CLIENT_PAYMENT)
- `supplier`: ObjectId (Referencia a Supplier, requerido si es SUPPLIER_PAYMENT)
- `description`: String (Opcional)
- `imageUrl`: String (URL de Cloudinary con la imagen del comprobante/factura)
- `date`: Date (Fecha del pago)
- `createdBy`: ObjectId (Usuario que cargó el pago - Empleado o Admin)
- `user`: ObjectId (Dueño de los datos - Multi-tenancy)

## 2. Endpoints API (`/api/transactions`)

### Crear Transacción
**POST** `/api/transactions`
- **Auth**: Requerido (Empleado o Admin).
- **Body (FormData)**:
  - `type`: "CLIENT_PAYMENT" o "SUPPLIER_PAYMENT"
  - `amount`: Monto (Number)
  - `clientId`: ID del cliente (si es cobro a cliente)
  - `supplierId`: ID del proveedor (si es pago a proveedor)
  - `description`: Texto opcional
  - `date`: Fecha (opcional, default: ahora)
  - `image`: Archivo de imagen (JPG, PNG, PDF, etc.)
- **Efecto**:
  - Guarda la transacción.
  - Sube la imagen a Cloudinary (folder: `controlia/payments`).
  - **Actualiza automáticamente** el saldo:
    - `CLIENT_PAYMENT`: Resta el monto a `Client.balance`.
    - `SUPPLIER_PAYMENT`: Resta el monto a `Supplier.debt`.

### Listar Transacciones
**GET** `/api/transactions`
- **Auth**: Requerido (Empleado o Admin).
- **Query Params**:
  - `clientId`: Filtrar por cliente.
  - `supplierId`: Filtrar por proveedor.
- **Respuesta**: Array de transacciones, ordenadas por fecha descendente. Incluye `createdBy` populated (nombre/email del empleado).

### Modificar Transacción
**PUT** `/api/transactions/:id`
- **Auth**: **Solo Admin**.
- **Body (FormData)**:
  - `amount`: Nuevo monto (Si cambia, se recalcula el saldo del cliente/proveedor automáticamente).
  - `date`: Nueva fecha.
  - `description`: Nueva descripción.
  - `image`: Nueva imagen (reemplaza la anterior).

### Eliminar Transacción
**DELETE** `/api/transactions/:id`
- **Auth**: **Solo Admin**.
- **Efecto**:
  - Elimina el registro.
  - **Revierte el saldo**: Suma el monto eliminado de vuelta a `Client.balance` o `Supplier.debt`.

## 3. Notas para el Frontend Agent
- **Vistas**:
  - En el detalle de Cliente y Proveedor, agregar una pestaña o sección "Historial de Pagos".
  - Mostrar una tabla con: Fecha, Descripción, Monto, Comprobante (Link/Icono), Cargado Por.
- **Acciones**:
  - Botón "Registrar Pago": Abre modal con formulario (Monto, Descripción, Fecha, Input File para imagen).
  - Si el usuario es Admin, habilitar botones de Editar/Eliminar en cada fila.
- **Validación**:
  - El backend valida que `amount > 0` y que exista el `client` o `supplier`.
- **Imágenes**:
  - Las imágenes vienen como URLs completas de Cloudinary. Usar `<a>` con `target="_blank"` o un modal de vista previa.

## 4. Reinicio Requerido
El servidor debe reiniciarse para que las nuevas rutas surtan efecto.
