import { ResumeData } from "@/types";

interface ExtractionResultsProps {
  data: ResumeData;
}

const ExtractionResults: React.FC<ExtractionResultsProps> = ({ data }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Extracted Resume Information</h2>

      {/* Profile */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Name:</strong> {data.profile.name || "Not found"}
            </p>
            <p>
              <strong>Email:</strong> {data.profile.email || "Not found"}
            </p>
          </div>
          <div>
            <p>
              <strong>Phone:</strong> {data.profile.phone || "Not found"}
            </p>
            <p>
              <strong>Location:</strong> {data.profile.location || "Not found"}
            </p>
          </div>
        </div>
      </div>

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 border-b pb-2">
            Education
          </h3>
          {data.education.map((edu, index) => (
            <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
              {edu.institution && (
                <p>
                  <strong>Institution:</strong> {edu.institution}
                </p>
              )}
              {edu.degree && (
                <p>
                  <strong>Degree:</strong> {edu.degree}
                </p>
              )}
              {edu.date && (
                <p>
                  <strong>Date:</strong> {edu.date}
                </p>
              )}
              {edu.gpa && (
                <p>
                  <strong>GPA/Score:</strong> {edu.gpa}
                </p>
              )}
              {edu.description && (
                <p>
                  <strong>Details:</strong> {edu.description.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 border-b pb-2">
            Experience
          </h3>
          {data.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
              {exp.organization && (
                <p>
                  <strong>Organization:</strong> {exp.organization}
                </p>
              )}
              {exp.position && (
                <p>
                  <strong>Position:</strong> {exp.position}
                </p>
              )}
              {exp.date && (
                <p>
                  <strong>Date:</strong> {exp.date}
                </p>
              )}
              {exp.descriptions && exp.descriptions.length > 0 && (
                <div className="mt-2">
                  <strong>Responsibilities:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {exp.descriptions.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 border-b pb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Sections */}
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold">
          Raw Section Data (Debug)
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-sm max-h-96">
          {JSON.stringify(data.sections, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default ExtractionResults;
