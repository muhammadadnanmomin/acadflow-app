"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/auth/useProfile";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PayButton({
  conferenceId,
  amount,
}: {
  conferenceId: string;
  amount: number;
}) {
  const { profile, loading } = useProfile();
  const [ready, setReady] = useState(false);

  // Load Razorpay script on client
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      setReady(true);
    };

    document.body.appendChild(script);
  }, []);

  async function pay() {
    if (!profile) {
      alert("Please login first");
      return;
    }

    if (!ready || !window.Razorpay) {
      alert("Payment system loading...");
      return;
    }

    // Create order
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not loaded",
      });
      return;
    }

    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        conferenceId,
        userId: profile.id,
      }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: "AcadFlow",
      description: "Conference Registration",
      order_id: order.id,

      handler: function (response: any) {
        alert("Payment successful!");
        console.log(response);
      },

      theme: {
        color: "#4F46E5",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  if (loading) return null;

  return (
    <Button onClick={pay} disabled={!ready}>
      {ready ? `Pay ₹${amount}` : "Loading..."}
    </Button>
  );
}
