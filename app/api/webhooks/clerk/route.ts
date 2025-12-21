import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { deleteUserDb, upsertUserDb } from "@/core/features/users/db";

export async function POST(req: NextRequest) {
  try {
    const event = await verifyWebhook(req);

    switch (event.type) {
      case "user.created":
      case "user.updated":
        const clerkData = event.data;
        const email = clerkData.email_addresses.find(
          (email) => email.id === clerkData.primary_email_address_id
        )?.email_address;

        if (email == null) {
          return new Response("No primary email address found", {
            status: 400,
          });
        }

        await upsertUserDb({
          id: clerkData.id,
          email: email,
          name: `${clerkData.first_name} ${clerkData.last_name}`,
          image: clerkData.image_url,
          createdAt: new Date(clerkData.created_at),
          updatedAt: new Date(clerkData.updated_at),
        });
        break;
      case "user.deleted":
        if (event.data.id == null) {
          return new Response("No user id found", { status: 400 });
        }

        await deleteUserDb(event.data.id);
        break;
    }
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  return new Response("Webhook received", { status: 200 });
}
