import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import ChatSystem from "../ChatSystem";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  // Chat state variables
  const [showChat, setShowChat] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);

  useEffect(() => {
    try {
      axios
        .get("http://localhost:5000/api/v1/job/getall", {
          withCredentials: true,
        })
        .then((res) => {
          console.log("Jobs response:", res.data); // Debug the API response
          setJobs(res.data);
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  // Enhanced chat handler function
  const openChat = (job) => {
    if (user && user.role === "Job Seeker") {
      console.log("Opening chat for job:", job); // Debug what's in the job object
      console.log("Current user:", user);

      // Try different possible fields for recruiter ID
      let recruiterId =
        job.postedBy?._id || // If postedBy is populated
        job.postedBy || // If postedBy is just an ID
        job.recruiterId ||
        job.createdBy?._id || // If createdBy is populated
        job.createdBy || // If createdBy is just an ID
        job.employerId ||
        job.userId ||
        job.employer?._id || // If employer field exists
        job.employer;

      let recruiterName =
        job.postedBy?.name ||
        job.createdBy?.name ||
        job.employer?.name ||
        job.company ||
        "Recruiter";

      console.log("Extracted recruiter ID:", recruiterId);
      console.log("Extracted recruiter name:", recruiterName);

      if (!recruiterId) {
        console.error("Could not determine recruiter ID from job:", job);
        alert("Unable to start chat - recruiter information missing");
        return;
      }

      // Make sure we don't chat with ourselves
      if (recruiterId === user._id) {
        alert("You cannot chat with yourself!");
        return;
      }

      setSelectedRecruiter({
        id: recruiterId,
        name: recruiterName,
        jobId: job._id,
        jobTitle: job.title,
      });

      setShowChat(true);
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedRecruiter(null);
  };

  if (!isAuthorized) {
    navigateTo("/");
  }

  return (
    <section className="jobs page">
      <div className="container">
        <h1>ALL AVAILABLE JOBS</h1>
        <div className="banner">
          {jobs.jobs &&
            jobs.jobs.map((element) => {
              return (
                <div className="card" key={element._id}>
                  <p>{element.title}</p>
                  <p>{element.category}</p>
                  <p>{element.country}</p>
                  <div className="job-actions">
                    <Link to={`/job/${element._id}`}>Job Details</Link>
                    {user && user.role === "Job Seeker" && (
                      <button
                        onClick={() => openChat(element)}
                        className="chat-btn"
                        style={{
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          marginLeft: "10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        💬 Chat with Recruiter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Debug console logs */}
      {console.log("ChatSystem props in Jobs:", {
        currentUserId: user?._id,
        otherUserId: selectedRecruiter?.id,
        otherUserName: selectedRecruiter?.name,
        jobId: selectedRecruiter?.jobId,
        showChat,
      })}

      {/* ChatSystem component */}
      <ChatSystem
        currentUserId={user?._id}
        otherUserId={selectedRecruiter?.id}
        otherUserName={selectedRecruiter?.name}
        jobId={selectedRecruiter?.jobId}
        showChat={showChat}
        onClose={closeChat}
      />
    </section>
  );
};

export default Jobs;
