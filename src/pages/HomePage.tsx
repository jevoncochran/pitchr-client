import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen p-15">
      <div className="flex w-full h-full">
        <div className=" bg-light-grey w-[45%] rounded-lg"></div>
        <div className="bg-white w-[55%] flex flex-col justify-center items-center space-y-15">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold">PitchR</h1>
            <h2 className="text-2xl semi-bold">
              CRM for Creative Entrepreneurs
            </h2>
          </div>
          <button
            className="bg-black w-48 text-white rounded-lg px-6 py-3 hover:bg-gray-800 transition cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
