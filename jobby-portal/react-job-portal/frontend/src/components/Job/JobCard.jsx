import React from "react";

const JobCard = ({ job }) => {
  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>
        <strong>Company:</strong> {job.company}
      </p>
      <p>
        <strong>Location:</strong> {job.location}
      </p>
      <p>
        <strong>Salary:</strong>{" "}
        {job.fixedSalary || `${job.salaryFrom} - ${job.salaryTo}`}
      </p>
      <div className="skills-section">
        <strong>Required Skills:</strong>
        <div className="skills-tags">
          {job.skillsRequired?.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>
      <button onClick={() => navigate(`/job/${job._id}`)}>View Details</button>
    </div>
  );
};

export default JobCard;
