import React, { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";  // ← named import, not `type z`

import { ProfileSchema, JobRoleEnum } from "@vak/contract";

import { supabase } from "../../../lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type FormValues = z.infer<typeof ProfileSchema>;

function getEnumOptions(enumLike: any): string[] {
  if (!enumLike) return [];

  if (Array.isArray(enumLike.options)) return enumLike.options;

  if (enumLike.enum && typeof enumLike.enum === "object") {
    return Object.values(enumLike.enum).filter((v) => typeof v === "string");
  }

  if (typeof enumLike === "object") {
    return Object.values(enumLike).filter((v) => typeof v === "string");
  }

  return [];
}

export default function AddEmployeeModal({ open, onClose, onCreated }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const roleOptions = useMemo(() => getEnumOptions(JobRoleEnum), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: (roleOptions[0] ?? "") as any,
      hourly_rate: 0,
    },
  });

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    const { error } = await supabase.from("profiles").insert({
      full_name: values.full_name,
      email: values.email,
      role: values.role,
      hourly_rate: values.hourly_rate,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    reset();
    onClose();
    onCreated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Employee</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="John Doe"
              {...register("full_name")}
            />
            {errors.full_name?.message && (
              <div className="mt-1 text-sm text-red-600">
                {String(errors.full_name.message)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="john@vak.com"
              {...register("email")}
            />
            {errors.email?.message && (
              <div className="mt-1 text-sm text-red-600">
                {String(errors.email.message)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select className="mt-1 w-full rounded border px-3 py-2" {...register("role" as any)}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.role?.message && (
              <div className="mt-1 text-sm text-red-600">
                {String(errors.role.message)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Hourly Rate</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded border px-3 py-2"
              {...register("hourly_rate" as any, { valueAsNumber: true })}
            />
            {errors.hourly_rate?.message && (
              <div className="mt-1 text-sm text-red-600">
                {String(errors.hourly_rate.message)}
              </div>
            )}
          </div>

          {serverError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}