# Reporte de Backend - Historial Financiero Completo

Se ha extendido el sistema de transacciones para soportar no solo **pagos**, sino también la **generación de deuda** (Pedidos de proveedores y Ventas fiadas/Cuenta corriente).

## 1. Nuevos Tipos de Transacción
El modelo `Transaction` ahora soporta los siguientes tipos en el campo `type`:

| Tipo | Descripción | Efecto Automático |
| :--- | :--- | :--- |
| **`CLIENT_PAYMENT`** | Cliente paga su deuda | **Resta** Saldo (Balance) del Cliente |
| **`SUPPLIER_PAYMENT`** | Pagamos al Proveedor | **Resta** Deuda (Debt) del Proveedor |
| **`CLIENT_DEBT`** | **NUEVO:** Venta fiada / Manual | **Suma** Saldo (Balance) del Cliente |
| **`SUPPLIER_DEBT`** | **NUEVO:** Pedido recibido / Manual | **Suma** Deuda (Debt) del Proveedor |

## 2. API Endpoints (`/api/transactions`)

### Crear Transacción (Manual)
**POST** `/api/transactions`
- **Body**:
  - `type`: Uno de los 4 valores de arriba.
  - `amount`: Monto positivo.
  - `clientId` o `supplierId`: Según corresponda.
  - `description`: Ej: "Pedido de Coca-Cola", "Fiado juan".
  - `image`: Foto de la factura o remito.
- **Lógica**:
  - Si envías `SUPPLIER_DEBT` (ej. llegó mercadería y factura), aumentará la deuda con ese proveedor.
  - Si envías `CLIENT_DEBT` (ej. se llevó algo y no pagó), aumentará el saldo deudor del cliente.

### Listar Historial
**GET** `/api/transactions`
- Recomendación para Frontend:
  - En el perfil de Cliente/Proveedor, mostrar una tabla unificada de "Cuenta Corriente".
  - Columnas: Fecha | Tipo (Debe/Haber) | Descripción | Monto | Comprobante | Acciones.
  - **Saldo Visual**:
    - `CLIENT_DEBT` / `SUPPLIER_DEBT` = Aumenta Deuda (Rojo).
    - `CLIENT_PAYMENT` / `SUPPLIER_PAYMENT` = Disminuye Deuda (Verde).

### Edición y Eliminación
- **PUT** y **DELETE** `/api/transactions/:id`
- **Solo Admin**.
- El sistema revierte o ajusta automáticamente los saldos si se edita el monto o elimina el registro.

## 3. Notas de Implementación Frontend
- **Botones de Acción**:
  - En Perfil Proveedor:
    - [Registrar Pago] -> `SUPPLIER_PAYMENT` (Baja deuda)
    - [Registrar Pedido/Factura] -> `SUPPLIER_DEBT` (Sube deuda)
  - En Perfil Cliente:
    - [Registrar Cobro] -> `CLIENT_PAYMENT` (Baja deuda)
    - [Agregar a Cuenta/Fiado] -> `CLIENT_DEBT` (Sube deuda)
- **Validación Visual**:
  - Diferenciar visualmente en la lista los movimientos que suman deuda de los que restan.

## 4. Reinicio
Reiniciar servidor para aplicar cambios.
