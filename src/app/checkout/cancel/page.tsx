import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen place-items-center px-5 py-12">
      <div className="surface-card w-full max-w-md p-7 sm:p-9">
        <h1 className="text-xl font-bold text-foreground">Payment cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">No workspace was created and no charge was made. You can register again whenever you are ready.</p>
        <div className="mt-6"><Link href="/register" className="inline-flex items-center justify-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground">Try again</Link></div>
      </div>
    </main>
  );
}
