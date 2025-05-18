function Login() {
  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:8000/login";
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Login with Google
      </button>
    </div>
  );
}

export default Login;
