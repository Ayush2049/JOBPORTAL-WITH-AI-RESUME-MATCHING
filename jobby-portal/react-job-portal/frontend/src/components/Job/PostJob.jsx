import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");

  // ✅ New skill section states
  const [skillSection, setSkillSection] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");

  const { isAuthorized, user } = useContext(Context);

  // ✅ Functions for managing skills
  const addSkill = () => {
    if (
      currentSkill.trim() &&
      !skillSection.some(
        (skill) => skill.name.toLowerCase() === currentSkill.toLowerCase()
      )
    ) {
      setSkillSection([...skillSection, { name: currentSkill.trim() }]);
      setCurrentSkill("");
    } else if (
      skillSection.some(
        (skill) => skill.name.toLowerCase() === currentSkill.toLowerCase()
      )
    ) {
      toast.error("Skill already added!");
    }
  };

  const removeSkill = (indexToRemove) => {
    setSkillSection(skillSection.filter((_, index) => index !== indexToRemove));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleJobPost = async (e) => {
    e.preventDefault();

    // ✅ Validate skills before posting
    if (skillSection.length === 0) {
      toast.error("Please add at least one skill!");
      return;
    }

    if (salaryType === "Fixed Salary") {
      setSalaryFrom("");
      setSalaryTo("");
    } else if (salaryType === "Ranged Salary") {
      setFixedSalary("");
    } else {
      setSalaryFrom("");
      setSalaryTo("");
      setFixedSalary("");
    }

    await axios
      .post(
        "http://localhost:5000/api/v1/job/post",
        fixedSalary.length >= 4
          ? {
              title,
              description,
              category,
              country,
              city,
              location,
              fixedSalary,
              skillSection, // ✅ included
            }
          : {
              title,
              description,
              category,
              country,
              city,
              location,
              salaryFrom,
              salaryTo,
              skillSection, // ✅ included
            },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        toast.success(res.data.message);

        // ✅ Reset form including skills
        setTitle("");
        setDescription("");
        setCategory("");
        setCountry("");
        setCity("");
        setLocation("");
        setSalaryFrom("");
        setSalaryTo("");
        setFixedSalary("");
        setSalaryType("default");
        setSkillSection([]);
        setCurrentSkill("");
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      });
  };

  const navigateTo = useNavigate();
  if (!isAuthorized || (user && user.role !== "Employer")) {
    navigateTo("/");
  }

  return (
    <>
      <div className="job_post page">
        <div className="container">
          <h3>POST NEW JOB</h3>
          <form onSubmit={handleJobPost}>
            <div className="wrapper">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job Title"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Graphics & Design">Graphics & Design</option>
                <option value="Mobile App Development">
                  Mobile App Development
                </option>
                <option value="Frontend Web Development">
                  Frontend Web Development
                </option>
                <option value="Business Development Executive">
                  Business Development Executive
                </option>
                <option value="Account & Finance">Account & Finance</option>
                <option value="Artificial Intelligence">
                  Artificial Intelligence
                </option>
                <option value="Video Animation">Video Animation</option>
                <option value="MEAN Stack Development">
                  MEAN STACK Development
                </option>
                <option value="MERN Stack Development">
                  MERN STACK Development
                </option>
                <option value="Data Entry Operator">Data Entry Operator</option>
              </select>
            </div>
            <div className="wrapper">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />

            {/* ✅ Skills Section */}
            <div className="skills_section">
              <h4>Required Skills *</h4>
              <div className="skill_input_wrapper">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleSkillKeyPress}
                  placeholder="Enter a required skill and press Enter"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="add_skill_btn"
                >
                  Add Skill
                </button>
              </div>

              <div className="skills_display">
                {skillSection.map((skill, index) => (
                  <div key={index} className="skill_tag">
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="remove_skill_btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {skillSection.length === 0 && (
                <p className="skills_hint">
                  Please add at least one required skill
                </p>
              )}
            </div>

            <div className="salary_wrapper">
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
              >
                <option value="default">Select Salary Type</option>
                <option value="Fixed Salary">Fixed Salary</option>
                <option value="Ranged Salary">Ranged Salary</option>
              </select>
              <div>
                {salaryType === "default" ? (
                  <p>Please provide Salary Type *</p>
                ) : salaryType === "Fixed Salary" ? (
                  <input
                    type="number"
                    placeholder="Enter Fixed Salary"
                    value={fixedSalary}
                    onChange={(e) => setFixedSalary(e.target.value)}
                  />
                ) : (
                  <div className="ranged_salary">
                    <input
                      type="number"
                      placeholder="Salary From"
                      value={salaryFrom}
                      onChange={(e) => setSalaryFrom(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Salary To"
                      value={salaryTo}
                      onChange={(e) => setSalaryTo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <textarea
              rows="10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job Description"
            />
            <button type="submit">Create Job</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PostJob;
