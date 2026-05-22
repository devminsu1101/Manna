import BottomNav from "@/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <BottomNav />
    </>
  );
}
