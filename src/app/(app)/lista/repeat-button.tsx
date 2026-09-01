"use client";

import { useState } from "react";
import { toast } from "sonner";
import { repeatLastAction } from "./actions";
import { Button } from "@/components/ui/button";

export function RepeatButton() {
  const [loading, setLoading] = useState(false);
  async function repeat() {
    setLoading(true);
    const res = await repeatLastAction(); // sucesso redireciona no servidor
    if (res?.error) {
      toast(res.error);
      setLoading(false);
    }
  }
  return (
    <Button type="button" variant="secondary" size="sm" loading={loading} onClick={repeat}>
      Repetir última
    </Button>
  );
}
