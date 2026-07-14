import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-1 flex-col">
      <main className="flex-1 px-5 pb-6 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
