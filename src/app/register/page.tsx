import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { LogoMark } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <LogoMark size={28} />invenzo<span className="-ml-2 text-primary">.</span>
        </Link>
        <Card className="p-6 sm:p-10">
          <CardHeader className="text-center pb-6">
            <p className="text-xs font-bold tracking-[.16em] text-primary">GET STARTED</p>
            <CardTitle className="mt-3 text-3xl">Set up your business workspace</CardTitle>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Create your owner account and first branch. Choose a plan and pay securely — your workspace is activated immediately after payment.</p>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <div className="mt-7 flex items-start gap-2.5 rounded-xl bg-surface-hover p-4 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 shrink-0 text-primary" size={16} />
              <span>Your workspace is private. Every request checks your verified membership and assigned role on the server.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}