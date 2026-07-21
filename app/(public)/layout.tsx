import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { FloatingDemoButton } from "@/components/demo/FloatingDemoButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Navbar */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky floating CTA */}
      <FloatingDemoButton />

    </div>
  );
}
