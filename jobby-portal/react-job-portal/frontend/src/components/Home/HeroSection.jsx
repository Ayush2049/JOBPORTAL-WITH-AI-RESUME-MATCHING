import React from "react";
import { FaBuilding, FaSuitcase, FaUsers, FaUserPlus } from "react-icons/fa";

const HeroSection = () => {
  const details = [
    {
      id: 1,
      title: "1,23,441",
      subTitle: "Live Jobs",
      icon: <FaSuitcase />,
    },
    {
      id: 2,
      title: "91,220",
      subTitle: "Companies",
      icon: <FaBuilding />,
    },
    {
      id: 3,
      title: "2,34,200",
      subTitle: "Job Seekers",
      icon: <FaUsers />,
    },
    {
      id: 4,
      title: "1,03,761",
      subTitle: "Employers",
      icon: <FaUserPlus />,
    },
  ];

  return (
    <div className="heroSection">
      {/* Background image with overlay */}
      <div className="heroBackground">
        <img src="/opaque_bg.jpg" alt="hero" />
        <div className="overlay"></div>
      </div>

      {/* Foreground content */}
      <div className="heroContent">
        <h1>Find the job that suits your skills</h1>
        <p>
          Discover opportunities that match your expertise. Connect with top
          employers and advance your career in a way that’s right for you.
        </p>
      </div>

      {/* Statistic cards */}
      <div className="details">
        {details.map((element) => (
          <div className="card" key={element.id}>
            <div className="icon">{element.icon}</div>
            <div className="content">
              <p className="title">{element.title}</p>
              <p className="subTitle">{element.subTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

HeroSection.jsx;
