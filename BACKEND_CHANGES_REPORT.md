# Reporte de Backend - Historial Financiero & Asociación de Ventas

## 🆕 Cambio Reciente: Venta Asociada a Cliente
Se ha modificado el endpoint de creación de venta para permitir asociar una venta a un cliente registrado.

### **POST /api/sales**
Ahora acepta un campo opcional `clientId`.
- **Body**:
  ```json
  {
    "products": [...],
    "total": 1000,
    "paymentMethod": "efectivo",
    "clientId": "64f..."  // <--- NUEVO (Opcional)
  }
  ```
- **Efecto**:
  - Guarda el ID del cliente en el objeto `Sale`.
  - Esto permitirá filtrar ventas por cliente en el futuro para ver "qué se llevó".

---

## 1. Historial Financiero (Transacciones)
El modelo `Transaction` soporta pagos y generación de deuda.

| Tipo | Descripción | Efecto Automático |
| :--- | :--- | :--- |
| **`CLIENT_PAYMENT`** | Cliente paga su deuda | **Resta** Saldo (Balance) del Cliente |
| **`SUPPLIER_PAYMENT`** | Pagamos al Proveedor | **Resta** Deuda (Debt) del Proveedor |
| **`CLIENT_DEBT`** | **NUEVO:** Venta fiada / Manual | **Suma** Saldo (Balance) del Cliente |
| **`SUPPLIER_DEBT`** | **NUEVO:** Pedido recibido / Manual | **Suma** Deuda (Debt) del Proveedor |

### API Endpoints (`/api/transactions`)

#### Crear Transacción (Manual)
**POST** `/api/transactions`
- **Body**:
  - `type`: Uno de los 4 valores de arriba.
  - `amount`: Monto positivo.
  - `clientId` o `supplierId`: Según corresponda.
  - `description`: Ej: "Pedido de Coca-Cola", "Fiado juan".
  - `image`: Foto de la factura o remito.

#### Listar Historial
**GET** `/api/transactions`
- Filtros: `?clientId=...` o `?supplierId=...`
- Recomendación: Mostrar una tabla unificada de "Cuenta Corriente" en el perfil.

#### Edición y Eliminación (Solo Admin)
**PUT** y **DELETE** `/api/transactions/:id`
- El sistema ajusta automáticamente los saldos al editar o eliminar.

## 2. Notas para Frontend
- **Al crear una venta (POS)**: Agregar un selector de Cliente (Buscador). Si se selecciona, enviar `clientId` en el POST.
- **Perfil de Cliente**:
  - Mostrar historial de "Transacciones" (Pagos y Fiados).
  - (Futuro) Podríamos agregar una pestaña "Ventas" que filtre `/api/sales?client=ID` (pendiente de implementar filtro en GET sales si es necesario).
