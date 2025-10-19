import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";
import ChatSystem from "../ChatSystem";

const MyApplications = () => {
  const { user, isAuthorized } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");

  // Chat state variables
  const [showChat, setShowChat] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const navigateTo = useNavigate();

  // Handle authorization redirect
  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
    }
  }, [isAuthorized, navigateTo]);

  // Fetch applications
  const fetchApplications = async () => {
    if (!isAuthorized || !user) return;

    try {
      let endpoint;
      if (user.role === "Employer") {
        endpoint = "http://localhost:5000/api/v1/application/employer/getall";
      } else {
        endpoint = "http://localhost:5000/api/v1/application/jobseeker/getall";
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      console.log("Fetched applications:", response.data.applications);
      setApplications(response.data.applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to fetch applications");
      }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [isAuthorized, user]);

  // Simple test function
  const testButtonClick = () => {
    console.log("🧪 TEST BUTTON CLICKED!");
    alert("Button click is working!");
  };

  // Fixed openChat function based on your data structure
  const openChat = (application) => {
    console.log("🚀 OPEN CHAT FUNCTION CALLED!");
    console.log("Application:", application);
    console.log("User role:", user?.role);
    console.log("User ID:", user?._id);

    let otherUserId, otherUserName;

    if (user.role === "Employer") {
      // Employer wants to chat with job seeker
      otherUserId = application.applicantID?.user;
      otherUserName = application.name || "Job Seeker";
      console.log("Employer mode - Job seeker ID:", otherUserId);
    } else if (user.role === "Job Seeker") {
      // Job seeker wants to chat with employer
      otherUserId = application.employerID?.user;
      otherUserName = "Employer";
      console.log("Job seeker mode - Employer ID:", otherUserId);
    }

    if (!otherUserId) {
      console.error("❌ No other user ID found");
      toast.error("Cannot start chat - user information missing");
      return;
    }

    if (otherUserId === user._id) {
      console.error("❌ Cannot chat with yourself");
      toast.error("You cannot chat with yourself!");
      return;
    }

    console.log("✅ Setting up chat with:", { otherUserId, otherUserName });

    setSelectedApplicant({
      id: otherUserId,
      name: otherUserName,
      jobId: null,
    });

    setShowChat(true);
    console.log("✅ Chat should now be visible");
  };

  const closeChat = () => {
    console.log("❌ Closing chat");
    setShowChat(false);
    setSelectedApplicant(null);
  };

  // Other functions
  const handleRefresh = () => {
    toast.success("Refreshing applications...");
    fetchApplications();
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/application/${id}/status`,
        { status },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(`Application status updated to ${status}`);

      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app._id === id ? { ...app, status: status } : app
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update application status");
      }
    }
  };

  const deleteApplication = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/v1/application/delete/${id}`,
        {
          withCredentials: true,
        }
      );

      toast.success(response.data.message);
      setApplications((prevApplication) =>
        prevApplication.filter((application) => application._id !== id)
      );
    } catch (error) {
      console.error("Error deleting application:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to delete application");
      }
    }
  };

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (!isAuthorized) {
    return null;
  }

  console.log("🔍 Current state:", {
    selectedApplicant,
    showChat,
    userRole: user?.role,
    userId: user?._id,
  });

  return (
    <section className="my_applications page">
      {/* Test button */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f0f0f0",
          marginBottom: "20px",
        }}
      ></div>

      {user && user.role === "Job Seeker" ? (
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1>My Applications</h1>
            <button
              onClick={handleRefresh}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔄 Refresh Status
            </button>
          </div>
          {applications.length <= 0 ? (
            <center>
              <h4>No Applications Found</h4>
            </center>
          ) : (
            applications.map((element) => (
              <JobSeekerCard
                element={element}
                key={element._id}
                deleteApplication={deleteApplication}
                openModal={openModal}
                openChat={openChat}
                userRole={user.role}
              />
            ))
          )}
        </div>
      ) : (
        <div className="container">
          <center>
            <h1>Applications From Job Seekers</h1>
          </center>
          {applications.length <= 0 ? (
            <center>
              <h4>No Applications Found</h4>
            </center>
          ) : (
            applications.map((element) => (
              <EmployerCard
                element={element}
                key={element._id}
                openModal={openModal}
                updateStatus={updateStatus}
                openChat={openChat}
                userRole={user.role}
              />
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />
      )}

      {/* ChatSystem component */}
      <ChatSystem
        currentUserId={user?._id}
        otherUserId={selectedApplicant?.id}
        otherUserName={selectedApplicant?.name}
        jobId={selectedApplicant?.jobId}
        showChat={showChat}
        onClose={closeChat}
      />
    </section>
  );
};

export default MyApplications;

// Simple JobSeekerCard component with enhanced debugging
const JobSeekerCard = ({
  element,
  deleteApplication,
  openModal,
  openChat,
  userRole,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ffc107";
      case "On Review":
        return "#007bff";
      case "Accepted":
        return "#28a745";
      case "Rejected":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const handleChatClick = () => {
    console.log("🎯 JobSeekerCard chat button clicked for:", element.name);
    console.log("🎯 Full element:", element);
    openChat(element);
  };

  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
        <p>
          <span>Status:</span>
          <strong
            style={{
              color: getStatusColor(element.status || "Pending"),
              marginLeft: "8px",
              textTransform: "uppercase",
              fontSize: "14px",
            }}
          >
            {element.status || "Pending"}
          </strong>
        </p>
      </div>
      <div className="resume">
        <img
          src={element.resume.url}
          alt="resume"
          onClick={() => openModal(element.resume.url)}
        />
      </div>
      <div className="btn_area">
        <button
          onClick={handleChatClick}
          style={{
            backgroundColor: "#28a745",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          💬 Chat with Employer
        </button>
        <button
          onClick={() => deleteApplication(element._id)}
          style={{
            backgroundColor: "#dc3545",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Delete Application
        </button>
      </div>
    </div>
  );
};

// Simple EmployerCard component with enhanced debugging
const EmployerCard = ({
  element,
  openModal,
  updateStatus,
  openChat,
  userRole,
}) => {
  const handleChatClick = () => {
    console.log("🎯 EmployerCard chat button clicked for:", element.name);
    console.log("🎯 Full element:", element);
    openChat(element);
  };

  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
        {element.status && (
          <p>
            <span>Status:</span> <strong>{element.status}</strong>
          </p>
        )}
      </div>
      <div className="resume">
        <img
          src={element.resume.url}
          alt="resume"
          onClick={() => openModal(element.resume.url)}
        />
      </div>
      <div className="btn_area">
        <button
          onClick={handleChatClick}
          style={{
            backgroundColor: "#28a745",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          💬 Chat with Applicant
        </button>
        <button
          onClick={() => updateStatus(element._id, "On Review")}
          style={{
            backgroundColor: "#007bff",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          On Review
        </button>
        <button
          onClick={() => updateStatus(element._id, "Accepted")}
          style={{
            backgroundColor: "#28a745",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Accept
        </button>
        <button
          onClick={() => updateStatus(element._id, "Rejected")}
          style={{
            backgroundColor: "#dc3545",
            margin: "5px",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
};
