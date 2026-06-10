import React, { useEffect, useRef, useState } from "react";
import axios from "../utils/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useSocketContext } from "../context/SocketContext";
import { IoArrowBackSharp } from "react-icons/io5";
import { getMediaUrl } from "../utils/mediaUrl";

const Profile = ({ closeProfile, viewUser = null }) => {

    const navigate = useNavigate();

    const {
        authUser,
        setAuthUser
    } = useAuth();

    const isOwnProfile =
        !viewUser ||
        String(viewUser._id) === String(authUser?._id);

    const [profileData, setProfileData] = useState(
        isOwnProfile ? authUser : null
    );

    const [fullname, setFullname] = useState("");
    const [about, setAbout] = useState("");
    const [phone, setPhone] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!isOwnProfile);
    const [uploadingPic, setUploadingPic] = useState(false);
    const fileInputRef = useRef(null);
    const { socket } = useSocketContext();

    useEffect(() => {
        const handleProfileUpdated = (updated) => {
            const isRelevant =
                (viewUser && String(viewUser._id) === String(updated._id)) ||
                (isOwnProfile && String(authUser?._id) === String(updated._id));

            if (!isRelevant) return;

            setProfileData((prev) => ({ ...prev, ...updated }));
            if (isOwnProfile) {
                setFullname(updated.fullname || "");
                setAbout(updated.about || "");
                setPhone(updated.phone || "");
            }
        };
        socket?.on("profileUpdated", handleProfileUpdated);
        return () => socket?.off("profileUpdated", handleProfileUpdated);
    }, [socket, viewUser, isOwnProfile, authUser?._id]);

    useEffect(() => {

        if (isOwnProfile) {
            setProfileData(authUser);
            setFullname(authUser?.fullname || "");
            setAbout(authUser?.about || "");
            setPhone(authUser?.phone || "");
            return;
        }

        const fetchProfile = async () => {

            try {

                setFetching(true);

                const res = await axios.get(
                    `/api/user/profile/${viewUser._id}`
                );

                setProfileData(res.data);
                setFullname(res.data?.fullname || "");
                setAbout(res.data?.about || "");
                setPhone(res.data?.phone || "");

            } catch {

                alert("Failed to load profile");

            } finally {

                setFetching(false);

            }
        };

        if (viewUser?._id) {
            fetchProfile();
        }

    }, [viewUser, isOwnProfile, authUser]);

    const deleteAccount = async () => {

        const password = window.prompt(
            "Enter your password to permanently delete your account:"
        );

        if (!password) return;

        try {

            setLoading(true);

            await axios.delete(
                "/api/auth/account",
                { data: { password } }
            );

            try {
                await axios.post("/api/auth/logout");
            } catch (_) { /* cookie already cleared */ }

            localStorage.removeItem("chatapp");
            setAuthUser(null);
            toast.info("Account deleted successfully");
            navigate("/login", { replace: true });

        } catch (error) {

            alert(
                error?.response?.data?.message ||
                "Failed to delete account"
            );

        } finally {

            setLoading(false);

        }
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingPic(true);
            const formData = new FormData();
            formData.append("profile", file);
            const res = await axios.put("/api/auth/profile-pic", formData);
            localStorage.setItem("chatapp", JSON.stringify(res.data));
            setAuthUser(res.data);
            setProfileData(res.data);
            toast.success("Profile picture updated");
        } catch {
            toast.error("Failed to upload profile picture");
        } finally {
            setUploadingPic(false);
            e.target.value = "";
        }
    };

    const handleRemoveProfilePic = async () => {
        try {
            setUploadingPic(true);
            const res = await axios.delete("/api/auth/profile-pic");
            localStorage.setItem("chatapp", JSON.stringify(res.data));
            setAuthUser(res.data);
            setProfileData(res.data);
            toast.success("Profile picture removed");
        } catch {
            toast.error("Failed to remove profile picture");
        } finally {
            setUploadingPic(false);
        }
    };

    const saveProfile = async () => {

        try {

            setLoading(true);

            const res = await axios.put(
                "/api/auth/profile",
                {
                    fullname,
                    about,
                    phone
                }
            );

            localStorage.setItem(
                "chatapp",
                JSON.stringify(res.data)
            );

            setAuthUser(res.data);
            setProfileData(res.data);

            toast.success("Profile updated successfully");

        } catch {

            alert("Failed To Update Profile");

        } finally {

            setLoading(false);

        }
    };

    if (fetching) {
        return (
            <div className="h-full w-full bg-[#0b141a] flex items-center justify-center">
                <div className="loading loading-spinner text-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#0b141a] overflow-y-auto relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/15 via-transparent to-transparent pointer-events-none" />

            <div className="relative h-full w-full p-6 max-w-lg mx-auto">

                <div className="mb-6">

                    <button
                        onClick={closeProfile}
                        className="text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-all border border-white/5"
                    >
                        <IoArrowBackSharp size={20} />
                    </button>

                </div>

                <div className="flex flex-col items-center bg-[#1a2332]/80 backdrop-blur rounded-3xl p-8 border border-white/5 shadow-xl">

                    <div className="relative">
                        <img
                            src={getMediaUrl(profileData?.profilepic, profileData)}
                            alt="Profile"
                            className="w-32 h-32 rounded-full ring-4 ring-emerald-500/40 object-cover shadow-lg"
                        />
                        {isOwnProfile && uploadingPic && (
                            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                <span className="loading loading-spinner text-white" />
                            </div>
                        )}
                    </div>

                    {isOwnProfile && (
                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPic}
                                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                            >
                                Change photo
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveProfilePic}
                                disabled={uploadingPic}
                                className="px-4 py-2 text-sm bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition"
                            >
                                Remove photo
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePicUpload}
                            />
                        </div>
                    )}

                    <h2
                        className="
                    text-white
                    text-2xl
                    font-bold
                    mt-4
                    "
                    >
                        {profileData?.username}
                    </h2>

                    {isOwnProfile && (
                        <p className="text-slate-400 text-sm">
                            {profileData?.email}
                        </p>
                    )}

                    {!isOwnProfile && (
                        <p className="text-slate-400 text-sm mt-1">
                            Profile
                        </p>
                    )}

                </div>

                <div className="mt-6 space-y-4 bg-[#1a2332]/60 rounded-2xl p-5 border border-white/5">

                    <div>

                        <label className="text-slate-300 block mb-1">
                            Full Name
                        </label>

                        {isOwnProfile ? (
                            <input
                                type="text"
                                value={fullname}
                                onChange={(e) =>
                                    setFullname(e.target.value)
                                }
                                className="
                        w-full
                        bg-slate-700
                        text-white
                        p-3
                        rounded-xl
                        outline-none
                        "
                            />
                        ) : (
                            <p className="w-full bg-slate-800 text-white p-3 rounded-xl">
                                {fullname || "—"}
                            </p>
                        )}

                    </div>

                    <div>

                        <label className="text-slate-300 block mb-1">
                            Phone Number
                        </label>

                        {isOwnProfile ? (
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                                className="
                        w-full
                        bg-slate-700
                        text-white
                        p-3
                        rounded-xl
                        outline-none
                        "
                            />
                        ) : (
                            <p className="w-full bg-slate-800 text-white p-3 rounded-xl">
                                {phone || "—"}
                            </p>
                        )}

                    </div>

                    <div>

                        <label className="text-slate-300 block mb-1">
                            About
                        </label>

                        {isOwnProfile ? (
                            <textarea
                                rows={4}
                                value={about}
                                onChange={(e) =>
                                    setAbout(e.target.value)
                                }
                                className="
                        w-full
                        bg-slate-700
                        text-white
                        p-3
                        rounded-xl
                        outline-none
                        resize-none
                        "
                            />
                        ) : (
                            <p className="w-full bg-slate-800 text-white p-3 rounded-xl min-h-24 whitespace-pre-wrap">
                                {about || "No bio added yet."}
                            </p>
                        )}

                    </div>

                    {isOwnProfile && (
                        <>
                            <button
                                onClick={saveProfile}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
                            >
                                {
                                    loading
                                        ? "Saving..."
                                        : "Save Changes"
                                }
                            </button>

                            <button
                                type="button"
                                onClick={deleteAccount}
                                disabled={loading}
                                className="
                    w-full
                    bg-red-600/80
                    hover:bg-red-600
                    text-white
                    font-semibold
                    py-3
                    rounded-xl
                    transition-all
                    "
                            >
                                Permanently Delete Account
                            </button>
                        </>
                    )}

                </div>

            </div>

        </div>
    );


};

export default Profile;
