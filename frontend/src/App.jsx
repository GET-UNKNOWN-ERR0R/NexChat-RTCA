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
      <div className="w-screen h-[100dvh] md:h-screen overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<VerifyUser />}>
            <Route path="/" element={
              <div className="p-2 w-full h-full flex items-center justify-center overflow-hidden min-h-0">
                <Home />
              </div>
            } />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-center"
          autoClose={2500}
          hideProgressBar
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable={false}
          limit={2}
          toastClassName="!text-sm !py-2 !px-3 !min-h-0 !rounded-xl !shadow-lg"
          className="!top-2 md:!top-4 !left-1/2 !-translate-x-1/2 !w-auto !max-w-[min(85vw,320px)] md:!max-w-md"
          style={{ width: "auto" }}
        />
      </div>

    </>
  )
}

export default App