export default function ShinyText({ text = '', className = '', speed = 3 }) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-gray-300 via-amber-300 to-gray-300 bg-[length:200%_100%] animate-shine ${className}`}
      style={{
        animation: `shine ${speed}s linear infinite`,
      }}
    >
      {text}
      <style>{`
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </span>
  );
}
