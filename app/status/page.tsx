import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { CheckCircle2, AlertTriangle, Server, Database, Globe } from "lucide-react";

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      <Header />

      <section className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold">
          System Status
        </h1>

        <p className="mt-4 text-gray-600">
          Check the current operational status of AcadFlow services.
        </p>

        {/* Overall Status */}
        <div className="mt-8 rounded-xl border bg-green-50 p-6 flex items-center gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">
              All Systems Operational
            </p>
            <p className="text-sm text-green-700">
              No incidents reported.
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="mt-12 space-y-4">

          <StatusItem
            icon={<Globe className="h-5 w-5" />}
            title="Website & Dashboard"
            status="Operational"
          />

          <StatusItem
            icon={<Database className="h-5 w-5" />}
            title="Database & Storage"
            status="Operational"
          />

          <StatusItem
            icon={<Server className="h-5 w-5" />}
            title="API & Backend Services"
            status="Operational"
          />

          <StatusItem
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Payments (Razorpay)"
            status="Operational"
          />

        </div>

        {/* Incident History */}
        <div className="mt-16">

          <h2 className="text-xl font-semibold">
            Incident History
          </h2>

          <p className="text-gray-600 mt-2">
            No recent incidents reported.
          </p>

        </div>

        {/* Last Updated */}
        <p className="mt-12 text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>

      </section>

      <Footer />

    </main>
  );
}

function StatusItem({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
}) {
  const isOperational = status === "Operational";

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <span className="font-medium">{title}</span>
      </div>

      <span
        className={`text-sm font-medium ${
          isOperational
            ? "text-green-600"
            : "text-yellow-600"
        }`}
      >
        {status}
      </span>
    </div>
  );
}