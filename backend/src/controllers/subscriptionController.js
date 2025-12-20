import { preApproval } from "../config/mercadopago.js";
import User from "../models/User.js";

const SUBSCRIPTION_PLANS = {
  basic: {
    reason: "Controlia - Plan Básico",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 25000, 
      currency_id: "ARS",
    },
    back_url: "https://controlia.app/dashboard/settings/billing", 
  },
  gestion: {
    reason: "Controlia - Plan Gestión",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 59000, 
      currency_id: "ARS",
    },
    back_url: "https://controlia.app/dashboard/settings/billing",
  },
  avanzado: {
    reason: "Controlia - Plan Avanzado",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 120000,
      currency_id: "ARS",
    },
    back_url: "https://controlia.app/dashboard/settings/billing",
  },
};

export const createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    if (!SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({ message: "Plan inválido" });
    }

    const subscriptionData = {
      ...SUBSCRIPTION_PLANS[plan],
      payer_email: req.user.email,
      external_reference: userId.toString(), 
      status: "pending",
    };

    const response = await preApproval.create({ body: subscriptionData });

    res.status(201).json({
      init_point: response.init_point, // Link to redirect the user
      id: response.id,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Error al crear la suscripción" });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // We enter here when we receive a notification of type "subscription_preapproval"
    if (type === "subscription_preapproval") {
        const { id } = data;
        
        // We get the updated subscription status
        const subscription = await preApproval.get({ id });
        
        const userId = subscription.external_reference;
        const status = subscription.status; // authorized, paused, cancelled
        
        // Find user and update
        const user = await User.findById(userId);
        if (user) {
            user.mercadoPagoSubscriptionId = id;
            user.mercadoPagoPayerId = subscription.payer_id;
            user.subscriptionStatus = status;
            
            // Logic to update membership based on status
            if (status === 'authorized') {
                // Determine plan from amount or reason if needed, but we rely on the creation flow usually.
                // However, the webhook is mostly for status updates.
                // If we want to strictly sync the plan type, we might need to store "targetPlan" in DB 
                // or deduce it from subscription.reason.
                const planName = Object.keys(SUBSCRIPTION_PLANS).find(key => SUBSCRIPTION_PLANS[key].reason === subscription.reason);
                if (planName) {
                    user.membershipTier = planName;
                    
                    // Add 30 days to membershipEndDate from now or from next_payment_date
                    const nextPayment = subscription.next_payment_date ? new Date(subscription.next_payment_date) : new Date();
                    user.membershipEndDate = nextPayment;
                }
            } else if (status === 'cancelled' || status === 'paused') {
               // Logic for cancellation if needed, maybe don't downgrade immediately but wait for end date
            }

            await user.save();
        }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
};
