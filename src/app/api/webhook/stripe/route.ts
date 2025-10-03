import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, webhookSecret } from "@/constants/stripe";
import { processSubscriptonDelete, processInvoicePaid, processCheckoutSuccessWebhook } from "../../actions";
// This is where we receive Stripe webhook events. / It used to update the user data, send emails, etc...
// By default, it'll store the user in the database. 
export async function POST(req: NextRequest) {
  const textParsedBody = await req.text();
  const signature = headers().get("stripe-signature");
  let event: Stripe.Event;

  console.log('1 POST', textParsedBody)
  console.log('2 signature', signature)
  try {
    event = stripe.webhooks.constructEvent(textParsedBody, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const body = JSON.parse(textParsedBody);
        return processCheckoutSuccessWebhook(body, event)
      }
      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }
      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        break;
      }
      case "customer.subscription.deleted": {
        processSubscriptonDelete(event)
        break;
      }
      case "invoice.paid": {
        const body = JSON.parse(textParsedBody);
        processInvoicePaid(body, event)
        break;
      }
      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired
        break;
      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }
  return NextResponse.json({});
}
