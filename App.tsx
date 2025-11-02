import React, { useState, useCallback } from 'react';
import { CarAnalysis } from './types';
import { analyzeCarImage } from './services/geminiService';
import { UploadIcon, CarIcon, SparklesIcon } from './components/IconComponents';

// Helper Component: Loader
const Loader: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400 [animation-delay:0.2s]"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400 [animation-delay:0.4s]"></div>
    <span className="text-slate-300">Scanning...</span>
  </div>
);

// Helper Component: File Uploader
interface FileUploaderProps {
    onFileSelect: (file: File) => void;
}
const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto text-center">
            <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-slate-800 hover:bg-slate-700 transition-all duration-300 rounded-2xl p-8 sm:p-12 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center space-y-4"
            >
                <div className="bg-slate-700 p-4 rounded-full">
                    <UploadIcon className="w-10 h-10 text-blue-400" />
                </div>
                <span className="text-xl font-semibold text-slate-200">Upload Car Image</span>
                <p className="text-slate-400">Drag & drop or click to select a file</p>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>
    );
};

// Helper Component: Result Card
interface ResultCardProps {
    result: CarAnalysis;
}
const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
    const resultItems = [
        { label: "Make", value: result.make },
        { label: "Model", value: result.model },
        { label: "Color", value: result.color },
        { label: "Year", value: result.year },
    ];
    return (
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg w-full animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-3 text-green-400"/>
                Analysis Complete
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resultItems.map((item, index) => (
                     <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-slate-400">{item.label}</p>
                        <p className="text-lg font-semibold text-white truncate">{item.value}</p>
                     </div>
                ))}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<CarAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = useCallback((file: File) => {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setAnalysisResult(null);
        setError(null);
    }, []);

    const handleScan = useCallback(async () => {
        if (!imageFile) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeCarImage(imageFile);
            setAnalysisResult(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);

    const resetState = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setImageFile(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <div className="bg-slate-900 min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
            <header className="w-full max-w-4xl text-center mb-8 sm:mb-12">
                 <div className="flex items-center justify-center gap-4 mb-2">
                    <CarIcon className="w-12 h-12 text-blue-400" />
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
                        Car Scanner v1
                    </h1>
                </div>
                <p className="text-slate-400 text-lg">
                    Identify any car from an image with the power of AI.
                </p>
            </header>

            <main className="w-full max-w-4xl flex flex-col items-center space-y-6">
                {!imageFile ? (
                    <FileUploader onFileSelect={handleFileSelect} />
                ) : (
                    <div className="w-full flex flex-col items-center space-y-6 animate-fade-in">
                        <div className="relative w-full max-w-lg">
                            <img src={previewUrl!} alt="Car preview" className="rounded-2xl shadow-2xl object-contain w-full h-auto max-h-[50vh]" />
                            <button
                                onClick={resetState}
                                className="absolute top-3 right-3 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 transition-colors"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        {!analysisResult && (
                            <button
                                onClick={handleScan}
                                disabled={isLoading}
                                className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                {isLoading ? <Loader /> : 'Scan Image'}
                            </button>
                        )}

                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative animate-fade-in" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {analysisResult && (
                            <div className="w-full max-w-lg flex flex-col items-center space-y-4">
                              <ResultCard result={analysisResult} />
                              <button
                                  onClick={resetState}
                                  className="w-full max-w-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300"
                              >
                                  Scan Another Car
                              </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
             <footer className="w-full max-w-4xl text-center mt-auto pt-8 text-slate-500 text-sm">
                <p>Powered by Google Gemini</p>
            </footer>
        </div>
    );
};

export default App;
