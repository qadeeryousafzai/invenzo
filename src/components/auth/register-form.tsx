"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, planForKey } from "@/modules/billing/plans";

type FormValues = {
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  businessType: string;
  currency: string;
  timezone: string;
  description: string;
  taxId: string;
  website: string;
  phone: string;
  branchName: string;
  branchCode: string;
  branchPhone: string;
  branchAddress: string;
  address: string;
  latitude: string;
  longitude: string;
  plan: string;
};

const STEPS = 4;

export function RegisterForm() {
  const searchParams = useSearchParams();
  const urlPlanKey = (searchParams.get("plan") ?? "monthly") as string;
  const [step, setStep] = useState(1);
  const [planKey, setPlanKey] = useState(urlPlanKey);
  const plan = planForKey(planKey);
  const [values, setValues] = useState<FormValues>({
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "GENERAL_RETAIL",
    currency: "PKR",
    timezone: "UTC",
    description: "",
    taxId: "",
    website: "",
    phone: "",
    branchName: "Main branch",
    branchCode: "MAIN",
    branchPhone: "",
    branchAddress: "",
    address: "",
    latitude: "",
    longitude: "",
    plan: urlPlanKey,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (key: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  function handleLocate() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setField("latitude", String(latitude));
        setField("longitude", String(longitude));
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
            { headers: { "Accept-Language": "en", "User-Agent": "Invenzo/1.0" } },
          );
          const data = await resp.json();
          const addr = data?.address ?? {};
          const parts = [addr.house ?? addr.house_number, addr.road, addr.suburb, addr.city ?? addr.town ?? addr.village, addr.state, addr.country].filter(Boolean);
          if (parts.length) {
            setField("address", parts.join(", "));
            toast.success("Location detected and address filled.");
          } else {
            setField("address", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            toast.success("Location detected (coordinates).");
          }
        } catch {
          setField("address", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast.success("Location detected (coordinates).");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const codes: Record<number, string> = {
          1: "Location access was denied by the browser.",
          2: "Location information is unavailable.",
          3: "Location request timed out.",
        };
        toast.error(`${codes[err.code] ?? "Could not detect your location."} Please enter the address manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!values.ownerName.trim()) { setError("Enter your name."); return; }
      if (!values.email.trim()) { setError("Enter your email."); return; }
      if (!values.password || values.password.length < 12) { setError("Password must be 12+ characters."); return; }
      if (values.password !== values.confirmPassword) { setError("Passwords do not match."); return; }
    }
    if (step === 2) {
      if (!values.businessName.trim()) { setError("Enter your business name."); return; }
    }
    if (step === 3) {
      if (!values.branchName.trim()) { setError("Enter branch name."); return; }
      if (!values.branchCode.trim()) { setError("Enter branch code."); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handlePay() {
    setError("");
    if (!plan) { setError("Invalid plan selected."); toast.error("Invalid plan"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: values.ownerName,
          email: values.email,
          password: values.password,
          businessName: values.businessName,
          businessType: values.businessType,
          phone: values.phone || undefined,
          address: values.address || undefined,
          description: values.description || undefined,
          taxId: values.taxId || undefined,
          website: values.website || undefined,
          currency: values.currency,
          timezone: values.timezone,
          branchName: values.branchName,
          branchCode: values.branchCode,
          branchPhone: values.branchPhone || undefined,
          branchAddress: values.branchAddress || undefined,
          latitude: values.latitude || undefined,
          longitude: values.longitude || undefined,
          plan: planKey,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { const message = payload.error ?? "Checkout could not be started."; setError(message); toast.error(message); return; }
      const url = (payload as { url?: string }).url;
      if (!url) { const message = "Payment session could not be created."; setError(message); toast.error(message); return; }
      window.location.assign(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration service is unavailable. Check your connection and try again.";
      setError(message); toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const isLast = step === STEPS;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">Create your workspace</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Set up your business, branch, and plan</p>
      </CardHeader>
      <CardContent className="pb-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1 relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= n
                  ? "bg-primary text-white border-2 border-primary"
                  : "bg-surface border border-line text-muted"
              }`}>
                {step >= n ? <CheckCircle2 size={14} /> : n}
              </div>
              <span className={`text-xs font-medium ${step >= n ? "text-foreground" : "text-muted"}`}>
                {n === 1 ? "Account" : n === 2 ? "Business" : n === 3 ? "Branch" : "Plan & Pay"}
              </span>
              {n < STEPS && (
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 h-px w-8 ${step > n ? "bg-primary" : "bg-line"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Account */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Full name</Label>
                <Input id="ownerName" name="ownerName" value={values.ownerName} onChange={(e) => setField("ownerName", e.target.value)} autoComplete="name" required minLength={2} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" value={values.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={values.password} onChange={(e) => setField("password", e.target.value)} autoComplete="new-password" required minLength={12} maxLength={128} />
              <p className="text-xs text-muted-foreground">12+ characters, including uppercase, lowercase, and a number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={values.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} autoComplete="new-password" required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </div>
          </form>
        )}

        {/* Step 2: Business */}
        {step === 2 && (
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" name="businessName" value={values.businessName} onChange={(e) => setField("businessName", e.target.value)} required minLength={2} maxLength={191} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business type</Label>
                <Select name="businessType" value={values.businessType} onValueChange={(v: string) => setField("businessType", v)}>
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Business description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="description" name="description" value={values.description} onChange={(e) => setField("description", e.target.value)} className="min-h-[80px] resize-y" maxLength={2000} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select name="currency" value={values.currency} onValueChange={(v: string) => setField("currency", v)}>
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
                <Select name="timezone" value={values.timezone} onValueChange={(v: string) => setField("timezone", v)}>
                  <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Karachi">Pakistan</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Dubai">Gulf Standard Time</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="taxId" name="taxId" value={values.taxId} onChange={(e) => setField("taxId", e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="website" name="website" type="url" value={values.website} onChange={(e) => setField("website", e.target.value)} maxLength={255} placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Business phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="phone" name="phone" type="tel" value={values.phone} onChange={(e) => setField("phone", e.target.value)} maxLength={40} />
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between mt-4">
              <Button type="button" variant="outline" onClick={prevStep} disabled={busy}>Back</Button>
              <Button type="button" onClick={nextStep} disabled={busy}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </div>
          </form>
        )}

        {/* Step 3: Branch */}
        {step === 3 && (
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch name</Label>
                <Input id="branchName" name="branchName" value={values.branchName} onChange={(e) => setField("branchName", e.target.value)} required minLength={2} maxLength={191} defaultValue="Main branch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchCode">Branch code</Label>
                <Input id="branchCode" name="branchCode" value={values.branchCode} onChange={(e) => setField("branchCode", e.target.value)} className="uppercase" required minLength={2} maxLength={32} defaultValue="MAIN" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="branchPhone">Branch phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="branchPhone" name="branchPhone" type="tel" value={values.branchPhone} onChange={(e) => setField("branchPhone", e.target.value)} maxLength={40} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="branchAddress">Branch address <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="branchAddress" name="branchAddress" value={values.branchAddress} onChange={(e) => setField("branchAddress", e.target.value)} maxLength={1000} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Business address</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleLocate} disabled={locating} className="ml-auto flex-1">
                    {locating ? <LoaderCircle className="mr-2 h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />} Use my location
                  </Button>
                </div>
                <Input id="address" name="address" value={values.address} onChange={(e) => setField("address", e.target.value)} placeholder="Street, city, country" maxLength={1000} />
                <div className="mt-2 text-xs text-muted-foreground">
                  {values.latitude && values.longitude && (
                    <span className="flex items-center gap-1">
                      <span className="text-primary">Live location:</span> {values.latitude.slice(0, 8)}, {values.longitude.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between mt-4">
              <Button type="button" variant="outline" onClick={prevStep} disabled={busy}>Back</Button>
              <Button type="button" onClick={nextStep} disabled={busy}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </div>
          </form>
        )}

        {/* Step 4: Plan & Pay */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-surface p-6">
              <div className="grid gap-3 sm:grid-cols-2 items-center mb-4">
                <div className="space-y-1">
                  <Label>Select plan</Label>
                  <Select name="plan" value={planKey} onValueChange={(v: string) => { setPlanKey(v); setField("plan", v); }}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PLANS).map((p) => (
                        <SelectItem key={p.key} value={p.key}>{p.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs font-medium text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold text-foreground">PKR {plan?.price.toLocaleString() ?? "2,499"}</span>
                  <span className="text-xs text-muted-foreground">{plan?.accessMonths === null ? "One-time" : `/${plan?.name.toLowerCase()}`}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Pay securely with SafePay. Your workspace is activated instantly once payment is received — no manual approval needed.</p>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep} disabled={busy}>Back</Button>
              <Button type="button" onClick={handlePay} disabled={busy} className="w-auto">
                {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <>Pay &amp; create workspace <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">Already registered? <Link href="/login" className="font-medium text-primary hover:text-primary-hover">Sign in</Link></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
