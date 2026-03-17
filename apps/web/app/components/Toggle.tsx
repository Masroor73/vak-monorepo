// web/app/components/Toggle.tsx

type ToggleProps = {
  value: boolean;
  onChange: (v: boolean) => void;
};

function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full relative transition-colors ${
        value ? "bg-green-500" : "bg-gray-300"
      }`}
      type="button"
    >
      <span
        className={`h-6 w-6 bg-white rounded-full absolute top-0.5 transition-all ${
          value ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default Toggle;