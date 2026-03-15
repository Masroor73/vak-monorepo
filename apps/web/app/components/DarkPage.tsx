import { ReactNode } from "react";

export default function DaekPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {children}
      </div>

    </div>
  );
}