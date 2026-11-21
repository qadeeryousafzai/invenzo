"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (values.get("password") !== values.get("confirmPassword")) { setError("Passwords do not match."); toast.error("Passwords do not match"); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        ownerName: values.get("ownerName"), email: values.get("email"), password: values.get("password"), businessName: values.get("businessName"), businessType: values.get("businessType"), phone: values.get("phone") || undefined, address: values.get("address") || undefined, description: values.get("description") || undefined, taxId: values.get("taxId") || undefined, website: values.get("website") || undefined, currency: values.get("currency"), timezone: values.get("timezone"), branchName: values.get("branchName"), branchCode: values.get("branchCode"), branchPhone: values.get("branchPhone") || undefined, branchAddress: values.get("branchAddress") || undefined,
      }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { const message = payload.error ?? "Workspace could not be created."; setError(message); toast.error(message); return; }
      toast.success("Request submitted. Verify your email; workspace access starts after admin approval.");
      router.push("/verify-email?sent=1");
    } catch {
      const message = "Registration service is unavailable. Check your connection and try again.";
      setError(message); toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">Set up your business and first branch</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input id="ownerName" name="ownerName" autoComplete="name" required minLength={2} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" name="businessName" required minLength={2} maxLength={191} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business type</Label>
              <Select name="businessType" defaultValue="GENERAL_RETAIL">
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL_RETAIL">General retail</SelectItem>
                  <SelectItem value="PHARMACY">Pharmacy / medical</SelectItem>
                  <SelectItem value="GROCERY">Grocery / supermarket</SelectItem>
                  <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                  <SelectItem value="CLOTHING">Clothing</SelectItem>
                  <SelectItem value="WHOLESALE">Wholesale / distribution</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchName">First branch</Label>
              <Input id="branchName" name="branchName" required minLength={2} maxLength={191} defaultValue="Main branch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchCode">Branch code</Label>
              <Input id="branchCode" name="branchCode" className="uppercase" required minLength={2} maxLength={32} defaultValue="MAIN" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Business phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="phone" name="phone" type="tel" maxLength={40} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Business address <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="address" name="address" maxLength={1000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchPhone">Branch phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="branchPhone" name="branchPhone" type="tel" maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Branch address <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="branchAddress" name="branchAddress" maxLength={1000} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Business description <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="description" name="description" className="min-h-20 resize-y" maxLength={2000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="taxId" name="taxId" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="website" name="website" type="url" maxLength={255} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="PKR">
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — Pound Sterling</SelectItem>
                  <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                  <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue="UTC">
                <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Central Europe</SelectItem>
                  <SelectItem value="Asia/Karachi">Pakistan</SelectItem>
                  <SelectItem value="Asia/Kolkata">India</SelectItem>
                  <SelectItem value="Asia/Dubai">Gulf Standard Time</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
              <p className="text-xs text-muted-foreground">12+ characters, including uppercase, lowercase, and a number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">Your request will be reviewed by the platform admin. One month of access starts after approval and offline payment confirmation.</p>
          <Button className="w-full" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> : <>Submit workspace for approval <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
          <p className="text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-medium text-primary hover:text-primary-hover">Sign in</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}
