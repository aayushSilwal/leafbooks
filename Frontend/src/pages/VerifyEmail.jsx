import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { notifySuccess, notifyError } from "../components/utils.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("Invalid verification link");
      return;
    }

    axios
      .get(`http://localhost:8080/verify-email?token=${token}`)
      .then((res) => {
        notifySuccess(res.data.message);
        setStatus("Email verified! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        notifyError(err.response?.data?.message || "Verification failed");
        setStatus(err.response?.data?.message || "Verification failed");
      });
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>{status}</h2>
    </div>
  );
}
