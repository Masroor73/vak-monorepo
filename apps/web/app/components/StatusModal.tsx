//web/app/components/StatusModal.tsx
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0F172A] p-6 md:p-8 shadow-xl">
        <div
          className={`rounded-2xl p-6 md:p-8 text-center ${
            isSuccess ? "bg-[#BFE3C1]" : "bg-white"
          }`}
        >
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
            className="mx-auto block rounded-xl bg-[#1E66F5] px-10 py-3 text-white font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}