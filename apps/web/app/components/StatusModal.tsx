import React from "react";

type StatusModalProps = {
  open: boolean;
  type: "success" | "error";
  title?: string;
  message: string;
  onClose: () => void;
};

export default function StatusModal({
  open,
  type,
  title,
  message,
  onClose,
}: StatusModalProps) {
  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Card */}
      <div
        className={`relative w-full max-w-3xl rounded-xl border bg-white p-8 md:p-10 shadow-lg`}
      >
        <div
          className={`rounded-xl p-8 md:p-12 text-center ${
            isSuccess ? "bg-[#BFE3C1]" : "bg-white"
          }`}
        >
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            {isSuccess ? (
              <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-4xl leading-none">✓</span>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-[#7A0B0B] flex items-center justify-center">
                <span className="text-white text-4xl leading-none">!</span>
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {title ?? (isSuccess ? "Success!" : "Error!")}
          </h2>

          <p className="text-gray-700 text-base md:text-lg mb-8">{message}</p>

          <button
            onClick={onClose}
            className="mx-auto block rounded-md bg-[#1E66F5] px-10 py-3 text-white font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
