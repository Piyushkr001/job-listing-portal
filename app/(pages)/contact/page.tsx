"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, User, MessageSquare, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/contact", form);

      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("[Contact] submit error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-2 rounded-xl border bg-background px-5 py-6 shadow-sm">
        <h1 className="text-xl font-semibold md:text-2xl">Contact us</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Have a question, feedback, or partnership request? We’d love to hear
          from you.
        </p>
      </header>

      {/* Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Contact info */}
        <Card className="flex-1 border bg-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Get in touch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our team typically responds within 24–48 hours on business days.
            </p>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>support@hireorbit.com</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Form */}
        <Card className="flex-1 border bg-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Send us a message
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="space-y-1">
                <Label>Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  name="subject"
                  placeholder="Subject (optional)"
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <Label>Message *</Label>
                <Textarea
                  name="message"
                  rows={5}
                  placeholder="Write your message here..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="mt-2 rounded-full"
                disabled={loading}
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
