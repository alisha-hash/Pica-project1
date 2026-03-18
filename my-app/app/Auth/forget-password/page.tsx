"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call your API to send reset code to email
    // On success, navigate to verify-code page and pass email along
    router.push(`/auth/verify-code?email=${encodeURIComponent(email)}`);
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
          <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Forgot Password
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              Enter your email address and we'll send you a code to reset your
              password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm tracking-wide transition-colors duration-200"
              >
                Continue
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remembered your password?{" "}
              <a
                href="/auth/login"
                className="font-bold text-gray-900 hover:text-teal-600 transition"
              >
                Login
              </a>
            </p>
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