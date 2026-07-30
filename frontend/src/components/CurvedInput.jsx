import "./CurvedInput.css";

export default function CurvedInput({
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required = false,
  className = "",
  disabled = false,
}) {
  return (
    <div className={`curved-input-container relative flex items-center ${className}`}>
      {icon && <div className="absolute left-4 text-amber-400/80 z-10 pointer-events-none">{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full py-3.5 ${icon ? 'pl-11' : 'pl-4'} pr-4 bg-[#0a101f]/90 text-white placeholder-gray-500 rounded-xl border border-amber-500/20 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono text-sm`}
      />
    </div>
  );
}
