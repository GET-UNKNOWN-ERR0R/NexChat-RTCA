import Login from "./login/Login.jsx"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from "react-router-dom";
import Register from "./register/Register.jsx";
import Home from "./home/Home.jsx";
import Profile from "./pages/Profile.jsx";
import { VerifyUser } from "./utils/VerifyUser.jsx";
function App() {

  return (
    <>
      <div className="w-screen h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<VerifyUser />}>
            <Route path="/" element={
              <div className="p-2 w-full h-full flex items-center justify-center">
                <Home />
              </div>
            } />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
        <ToastContainer />
      </div>

    </>
  )
}

export default App