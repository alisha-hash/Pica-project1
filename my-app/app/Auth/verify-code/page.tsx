"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (codeError) setCodeError("");
    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 5).split("");
    const newOtp = [...otp];
    pasted.forEach((char, i) => {
      if (/\d/.test(char)) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 4)]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 5) {
      setCodeError("Incorrect code");
      return;
    }
    // TODO: call your API to verify code
    // On failed response: setCodeError("Incorrect code");
    // On success:
    router.push("/auth/new-password");
  };

  const handleResend = () => {
    setOtp(["", "", "", "", ""]);
    setCodeError("");
    inputRefs.current[0]?.focus();
    // TODO: call your API to resend code
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('./images/loginbg.jpeg')" }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo - centered */}
        <div className="pt-10 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Replace with your logo */}
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Beauvision
            </span>
          </div>
        </div>

        {/* Card - centered */}
        <div className="flex-1 flex items-center justify-center pb-10">
          <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              We have sent an code! to{" "}
              <span className="font-bold text-gray-900">{email}</span>
            </p>

            <form onSubmit={handleVerify}>
              {/* OTP inputs */}
              <div className="flex justify-center gap-3 mb-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-14 h-14 text-center text-lg font-semibold rounded-xl border-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      codeError
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-200 focus:ring-teal-500"
                    }`}
                  />
                ))}
              </div>

              {/* Error message */}
              {codeError && (
                <p className="text-red-500 text-xs text-center mb-3">
                  {codeError}
                </p>
              )}

              {/* Resend */}
              <p className="text-sm text-gray-500 text-center mb-6 mt-3">
                Didn't receive the email yet?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-teal-600 font-medium hover:underline transition"
                >
                  Resend
                </button>
              </p>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm tracking-wide transition-colors duration-200"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-sm text-gray-600 bg-white/80 backdrop-blur-sm">
        © Beauvision 2024 . All rights reserved. Powered By{" "}
        <a
          href="https://sundimension.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-teal-600 transition"
        >
          SunDimension
        </a>
      </div>
    </div>
  );
}