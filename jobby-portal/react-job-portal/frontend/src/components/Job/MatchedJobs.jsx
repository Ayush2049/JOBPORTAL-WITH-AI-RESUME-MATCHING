import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const MatchedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minMatchScore, setMinMatchScore] = useState(20);
  const [userSkills, setUserSkills] = useState([]);
  const [userMatchScore, setUserMatchScore] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const matchedSkills = searchParams.get("matchedSkills");
    const matchScore = searchParams.get("matchScore");
    const missingSkills = searchParams.get("missingSkills");

    if (matchedSkills) {
      try {
        const skills = JSON.parse(decodeURIComponent(matchedSkills));
        setUserSkills(skills);
        setUserMatchScore(parseInt(matchScore) || 0);
        fetchMatchedJobs(matchedSkills, minMatchScore);
      } catch (error) {
        console.error("Error parsing skills:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [location.search, minMatchScore]);

  const fetchMatchedJobs = async (matchedSkills, minScore) => {
    try {
      setLoading(true);
      // Update this URL to match your backend URL
      const response = await axios.get(
        `http://localhost:5000/api/v1/job/matched-jobs?matchedSkills=${matchedSkills}&minMatchScore=${minScore}`
      );
      setJobs(response.data.jobs);
    } catch (error) {
      console.error("Error fetching matched jobs:", error);
      // If backend endpoint doesn't exist, show sample jobs for now
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const JobCard = ({ job }) => (
    <div style={jobCardStyle}>
      <div style={matchScoreStyle}>Match Score: {job.matchScore || 0}%</div>
      <h3 style={jobTitleStyle}>{job.title}</h3>
      <p>
        <strong>Company:</strong> {job.company}
      </p>
      <p>
        <strong>Location:</strong> {job.location}
      </p>
      <p>
        <strong>Salary:</strong>{" "}
        {job.fixedSalary ||
          `${job.salaryFrom || "N/A"} - ${job.salaryTo || "N/A"}`}
      </p>

      {job.skillsRequired && job.skillsRequired.length > 0 && (
        <div style={skillsSectionStyle}>
          <strong>Required Skills:</strong>
          <div style={skillsContainerStyle}>
            {job.skillsRequired.map((skill, index) => (
              <span key={index} style={skillTagStyle}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <button style={buttonStyle} onClick={() => navigate(`/job/${job._id}`)}>
        View Details
      </button>
    </div>
  );

  // Inline styles for better compatibility
  const containerStyle = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "30px",
  };

  const filterSectionStyle = {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
  };

  const jobsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
  };

  const jobCardStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    position: "relative",
  };

  const matchScoreStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#28a745",
    color: "white",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  };

  const jobTitleStyle = {
    color: "#007bff",
    marginBottom: "10px",
  };

  const skillsSectionStyle = {
    margin: "15px 0",
  };

  const skillsContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    marginTop: "5px",
  };

  const skillTagStyle = {
    backgroundColor: "#e9ecef",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    border: "1px solid #ced4da",
  };

  const buttonStyle = {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  };

  const noJobsStyle = {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>🎯 Jobs Matched Based on Your Skills</h1>
        <p>
          Your Resume Match Score: <strong>{userMatchScore}%</strong>
        </p>
      </div>

      <div style={filterSectionStyle}>
        <h3>Filter Options</h3>
        <label>
          Minimum Match Score:
          <select
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value={0}>All Jobs (0%+)</option>
            <option value={20}>Good Match (20%+)</option>
            <option value={50}>Better Match (50%+)</option>
            <option value={70}>Best Match (70%+)</option>
          </select>
        </label>

        {userSkills.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <strong>Your Skills:</strong>
            <div style={skillsContainerStyle}>
              {userSkills.map((skill, index) => (
                <span
                  key={index}
                  style={{ ...skillTagStyle, backgroundColor: "#d4edda" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h3>Loading matched jobs...</h3>
        </div>
      ) : (
        <div style={jobsGridStyle}>
          {jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job._id} job={job} />)
          ) : (
            <div style={noJobsStyle}>
              <h3>No jobs found matching your criteria</h3>
              <p>
                Try lowering the minimum match score or check back later for new
                opportunities.
              </p>
              <button style={buttonStyle} onClick={() => setMinMatchScore(0)}>
                Show All Jobs
              </button>
              <br />
              <br />
              <button
                style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
                onClick={() => navigate("/jobs")}
              >
                Browse All Jobs
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchedJobs;
