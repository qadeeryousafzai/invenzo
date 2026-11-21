"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    let result;
    try {
      result = await signIn("credentials", { email: values.get("email"), password: values.get("password"), redirect: false });
    } catch {
      setBusy(false);
      const message = "Sign-in is temporarily unavailable. The authentication service may need database configuration.";
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(false);
    if (!result) {
      const message = "Sign-in is temporarily unavailable. Please try again later.";
      setError(message); toast.error(message);
    } else if (result.error === "CredentialsSignin") {
      const message = "Email or password is incorrect, or the email has not been verified.";
      setError(message); toast.error(message);
    } else if (result.error) {
      const message = "Sign-in is temporarily unavailable. The authentication service may need database configuration.";
      setError(message); toast.error(message);
    }
    else {
      toast.success("Signed in successfully");
      const callbackUrl = search.get("callbackUrl");
      router.push(callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard");
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your workspace</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-hover">Forgot password?</Link></div>
          <Button className="w-full" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
          <p className="text-center text-sm text-muted-foreground">New to Invenzo? <Link href="/register" className="font-medium text-primary hover:text-primary-hover">Create a workspace</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}
