import React, { useState /*, useEffect*/ } from "react";

const ModernLogin: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  // useEffect(() => {
  //   const cookies = document.cookie.split(";");
  //   // const hasAccessToken = cookies.some((cookie) =>
  //   //   // cookie.trim().startsWith("access_token=")
  //   // );
  //   if (hasAccessToken) {
  //     window.location.href = "/lobby";
  //   }
  // }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:8000/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating poker chips */}
      <div className="absolute top-20 left-20 w-6 h-6 bg-red-500 rounded-full opacity-20 animate-bounce delay-300"></div>
      <div className="absolute top-40 right-32 w-4 h-4 bg-blue-500 rounded-full opacity-20 animate-bounce delay-700"></div>
      <div className="absolute bottom-32 left-40 w-5 h-5 bg-yellow-500 rounded-full opacity-20 animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-purple-500 rounded-full opacity-20 animate-bounce delay-500"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl mb-6 shadow-2xl">
            <span className="text-3xl font-bold text-white">♠</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent mb-2">
            StaszicPoker
          </h1>
          <p className="text-slate-400 text-lg">
            Enter the ultimate poker experience
          </p>
        </div>

        {/* Login card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-400">Ready to play some poker?</p>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center space-x-2">
              <span className="text-lg">Login to Play</span>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  isHovered ? "translate-x-1" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>

          {/* Additional info */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex items-center justify-center space-x-6 text-slate-400 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>© 2025 StaszicPoker. All rights reserved.</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 text-6xl text-emerald-500/10 animate-pulse">
        ♦
      </div>
      <div className="absolute bottom-10 left-10 text-6xl text-emerald-500/10 animate-pulse delay-1000">
        ♣
      </div>
      <div className="absolute top-1/2 right-10 text-4xl text-emerald-500/10 animate-pulse delay-500">
        ♥
      </div>
    </div>
  );
};

export default ModernLogin;
