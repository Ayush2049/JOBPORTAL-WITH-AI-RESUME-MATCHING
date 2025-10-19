import React, { useEffect, useState } from "react";
import { FaUserPlus, FaSearch, FaPaperPlane } from "react-icons/fa";

const steps = [
  {
    icon: <FaUserPlus />,
    title: "Step 1: Create an Account",
    description: "Fill in your details and set up your profile.",
  },
  {
    icon: <FaSearch />,
    title: "Step 2: Find Jobs",
    description: "Browse jobs that match your skills and interests.",
  },
  {
    icon: <FaPaperPlane />,
    title: "Step 3: Apply",
    description: "Submit applications and track responses from employers.",
  },
  {
    icon: <FaPaperPlane />,
    title: "Step 4: Track Progress",
    description:
      "Monitor your applications and get notifications from employers.",
  },
];

const HowItWorks = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    const maxStep = steps.length - 1;

    if (currentStep > maxStep) {
      const restartTimeout = setTimeout(() => {
        setCurrentStep(0);
        setDisplayText("");
      }, 3000);
      return () => clearTimeout(restartTimeout);
    }

    let index = 0;
    const fullText = `${steps[currentStep].title} - ${steps[currentStep].description}`;

    const typeWriter = setInterval(() => {
      setDisplayText(fullText.substring(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(typeWriter);
        setTimeout(() => setCurrentStep((prev) => prev + 1), 800);
      }
    }, 40);

    return () => clearInterval(typeWriter);
  }, [currentStep]);

  return (
    <div className="howitworks">
      <div className="container">
        <div className="singleCard">
          {Array.from(
            { length: Math.min(currentStep + 1, steps.length) },
            (_, i) => (
              <div
                key={i}
                className={`stepWrapper ${
                  i === currentStep ? "active" : "done"
                }`}
              >
                <div className="icon">{steps[i].icon}</div>
                <p
                  className={`stepText ${
                    i === currentStep ? "typing" : "done"
                  }`}
                >
                  {i === currentStep
                    ? displayText
                    : `${steps[i].title} - ${steps[i].description}`}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
