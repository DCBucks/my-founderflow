import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method === "POST") {
    const sig = req.headers["stripe-signature"];
    const buf = await buffer(req);
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.customer_email;

      console.log("Processing checkout completion for email:", userEmail);

      if (userEmail) {
        try {
          // First, try to update existing user
          const { data: updateData, error: updateError } = await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("email", userEmail);

          if (updateError) {
            console.error("Error updating user:", updateError);

            // If user doesn't exist, create them
            if (updateError.code === "PGRST116") {
              console.log("User not found, creating new user...");
              const { data: insertData, error: insertError } = await supabase
                .from("users")
                .insert([
                  {
                    email: userEmail,
                    is_premium: true,
                    created_at: new Date().toISOString(),
                  },
                ]);

              if (insertError) {
                console.error("Error creating user:", insertError);
              } else {
                console.log("User created successfully:", insertData);
              }
            }
          } else {
            console.log("User updated successfully:", updateData);
          }
        } catch (error) {
          console.error("Webhook processing error:", error);
        }
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
