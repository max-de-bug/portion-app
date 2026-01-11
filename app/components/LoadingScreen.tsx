"use client";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md mx-auto mb-4">
          <span className="font-serif text-2xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">
            P
          </span>
        </div>
        <p className="text-sm text-gray-500">Loading Portion...</p>
      </div>
    </div>
  );
}
