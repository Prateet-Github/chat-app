import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [currentState, setCurrentState] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const validateFields = () => {
    if (!email.trim() || !password.trim()) {
      return "Email and password are required";
    }
    if (currentState === "Sign Up" && !username.trim()) {
      return "Username is required for sign up";
    }
    return null;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const validationError = validateFields();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      let authError = null;

      if (currentState === "Sign Up") {
        const { error } = await signUp(
          email.trim(),
          password.trim(),
          username.trim()
        );
        authError = error;
      } else {
        const { error } = await signIn(email.trim(), password.trim());
        authError = error;
      }

      if (authError) throw authError;

      navigate("/chat");
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={onSubmitHandler}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          {currentState}
        </h2>

        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}

        {currentState === "Sign Up" && (
          <input
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            type="text"
            placeholder="Username"
            required
            autoComplete="username"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
        )}

        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Password"
          required
          autoComplete={
            currentState === "Sign Up" ? "new-password" : "current-password"
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 transition"
        >
          {loading
            ? "Please wait..."
            : currentState === "Sign Up"
            ? "Create Account"
            : "Login"}
        </button>

        <div className="text-center text-sm">
          {currentState === "Sign Up" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentState("Login")}
                className="text-blue-600 hover:underline"
              >
                Login here
              </button>
            </p>
          ) : (
            <p>
              Create an account{" "}
              <button
                type="button"
                onClick={() => setCurrentState("Sign Up")}
                className="text-blue-600 hover:underline"
              >
                Click here
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;