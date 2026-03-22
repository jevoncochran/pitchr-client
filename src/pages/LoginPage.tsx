import { useEffect, useState, ChangeEvent, FormEvent, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    axios
      .post("http://localhost:3000/api/auth/login", credentials)
      .then((res) => {
        console.log(res);
        const { user, access_token } = res.data;
        console.log(auth?.login);
        auth?.login(user, access_token);
        navigate("/dashboard");
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((err) => {
        alert("Login failed");
      });
  };

  useEffect(() => {
    console.log("credentials: ", credentials);
  }, [credentials]);

  return (
    <div className="h-screen w-full flex justify-center items-center text-white">
      <div className=" bg-charcoal w-[500px] rounded-lg p-8">
        <h2 className="text-2xl text-center mb-6">VideoPro CRM</h2>
        <p className="text-2xl mb-3">Welcome back!</p>
        <p className="mb-6">Please login to your account</p>
        <form action="" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              id="email"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blackPrimary"
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-1"
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              id="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blackPrimary"
            />
          </div>
          <p className="mb-6 text-green-primary">Forgot password?</p>
          <button
            type="submit"
            className="w-full bg-green-primary text-white py-2 rounded-lg hover:bg-green-600 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
