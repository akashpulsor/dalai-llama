// src/pages/Login/Login.jsx
import React, { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "@dalaillama/shared-config";
import { login } from "@dalaillama/shared-store";
import { loadRuntime } from "../../config/runtime.js";
import { useDispatch } from "react-redux";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const runtime = loadRuntime();
  const [email, setEmail] = useState("");

  const handleLogin = () => {
    if (!email.trim()) {
      alert("Please enter email");
      return;
    }

    // Store email for authBootstrap
    localStorage.setItem("login_email", email.trim());

    // Trigger the bootstrap flow (mock or real)
     dispatch(login( email.trim()));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-300 p-4 relative overflow-hidden">
      <div className="relative bg-white bg-opacity-90 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-md border border-purple-100">

        {/* Branding */}
        <div className="flex flex-col items-center mb-6">
          {runtime?.brandLogo ? (
            <img
              src={runtime.brandLogo}
              className="w-24 h-24 rounded-full shadow-xl mb-3 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-purple-200 flex items-center justify-center shadow-xl text-4xl">
              🦙
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-purple-700 mt-4">
            {runtime?.brandName || "Contact Center Login"}
          </h1>
          <p className="text-gray-600 font-medium mt-1">
            Secure access to your communication console
          </p>
        </div>

        {/* Email input */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              appConfig.MOCK_MODE
                ? "admin@demo.com / supervisor / agent"
                : "Enter your email"
            }
            className="w-full border border-purple-300 rounded-xl p-4 pl-12 bg-purple-50
                       focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white 
                     p-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
        >
          <LogIn size={20} /> Continue
        </button>

        <div className="mt-10 text-center text-sm text-gray-600">
          <span className="font-medium">Powered by </span>
          <span className="text-purple-700 font-bold">Dalai Llama</span> 🦙
        </div>
      </div>
    </div>
  );
}
