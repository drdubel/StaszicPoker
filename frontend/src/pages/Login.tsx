import React from "react";

const BlankPage: React.FC = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:8000/login";
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default BlankPage;
