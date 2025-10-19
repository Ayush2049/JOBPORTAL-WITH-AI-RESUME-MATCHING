import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        onFileUpload(selectedFile);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          ) : file ? (
            <FileText className="h-10 w-10 text-green-500" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          {isLoading ? (
            <p className="text-gray-600">Processing resume...</p>
          ) : file ? (
            <div className="text-center">
              <p className="font-medium text-green-600">{file.name}</p>
              <p className="text-sm text-gray-500">Click to change file</p>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-500">Drop the PDF file here</p>
          ) : (
            <div className="text-center">
              <p className="font-medium">Drag & drop your resume</p>
              <p className="text-sm text-gray-500">
                or click to browse (PDF only)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
