// This component can be used to show a preview of the resume text
// For now, we'll create a simple placeholder

const ResumePreview: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Resume Preview</h3>
      <p className="text-gray-600">
        Resume preview will be shown here after parsing.
      </p>
    </div>
  );
};

export default ResumePreview;
