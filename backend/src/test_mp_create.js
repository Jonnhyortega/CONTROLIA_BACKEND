import { preApproval } from "./config/mercadopago.js";

const testSubscription = async () => {
  console.log("Iniciando prueba de creación de suscripción (PreApproval)...");
  
  const subscriptionData = {
      payer_email: "test_user_1234@test.com",
      back_url: "https://controlia.app",
      reason: "Plan Prueba",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 100,
        currency_id: "ARS"
      },
      status: "pending"
  };

  try {
    const response = await preApproval.create({ body: subscriptionData });
    console.log("¡ÉXITO! Suscripción creada. ID:", response.id);
    console.log("Init Point:", response.init_point);
  } catch (error) {
    console.error("FALLO al crear suscripción.");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    // console.error("Full Error:", JSON.stringify(error, null, 2));
    
    if (error.status === 401) {
        console.log("\nPOSIBLES CAUSAS DEL ERROR 401:");
        console.log("1. El Access Token es inválido o expiró.");
        console.log("2. El Access Token no pertenece a una cuenta que pueda crear suscripciones (¿cuenta de prueba vs real?).");
        console.log("3. El Access Token no tiene los permisos (scopes) necesarios.");
    }
  }
};

testSubscription();
