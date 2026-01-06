import { NextResponse } from "next/server";
import { transporter } from "@/lib/mailer";

export const runtime = "nodejs"; // ✅ REQUIRED

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, subject, message } = body ?? {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔎 Debug log (development only)
    console.log("[Contact API] Sending email:", {
      name,
      email,
      subject,
    });

    // Optional but VERY useful: verify transporter
    await transporter.verify();

    await transporter.sendMail({
      from: `"HireOrbit Contact" <${process.env.SMTP_FROM}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      replyTo: email,
      subject: subject || "New Contact Message",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "-"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [/api/contact] ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to send message",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
