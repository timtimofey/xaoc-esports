export default function BgWeapons() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
      {/* Background PUBG tactical silhouettes */}
      <svg
        className="absolute -top-10 -left-10 w-96 h-96 text-amber-500 transform -rotate-12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21 3L3 10.5V13.5L8.5 15.5L11 21H14L15.5 16.5L21 14.5V11.5L16.5 10L21 3Z" />
      </svg>
      <svg
        className="absolute top-1/2 -right-20 w-[500px] h-[500px] text-cyan-500 transform rotate-45"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
      </svg>
    </div>
  );
}
