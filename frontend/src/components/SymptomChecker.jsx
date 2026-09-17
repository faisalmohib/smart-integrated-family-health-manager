import { useState } from "react";
import axios from "axios";

import ResultSection from "./ResultSection";
import SourceList from "./SourceList";

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkSymptoms = async () => {
    if (!symptoms.trim()) {
      setError("Please describe your symptoms.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/symptoms/check",
        {
          symptoms: symptoms,
        }
      );

      setResult(response.data.response);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the healthcare assistant."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-6 py-10 text-gray-100"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, #175453 0%, #152c33 45%, #10191e 85%, #0b1114 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-4xl">

        {/* Title + Search Area */}
        <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">

          {/* Title Header */}
          <h1 className="mb-10 text-3xl font-normal tracking-wide text-gray-100 md:text-4xl">
            Wellcome TO SIFHM
          </h1>

          {/* Search / Prompt Input Box */}
          <div className="relative w-full max-w-2xl">

            <div className="flex items-center rounded-full border border-gray-700/60 bg-[#21292d]/90 p-2 pl-7 pr-2 shadow-2xl backdrop-blur-md transition-all focus-within:border-gray-500">

              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    checkSymptoms();
                  }
                }}
                placeholder="Ask MediPlan"
                className="w-full bg-transparent pr-4 text-base font-light text-gray-200 placeholder-gray-400 focus:outline-none"
              />

              {/* Enter Button */}
              <button
                onClick={checkSymptoms}
                disabled={loading}
                className="flex shrink-0 items-center space-x-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {loading ? "Checking..." : "Enter"}
                </span>

                {/* Corner Return Arrow */}
                <svg
                  className="h-4 w-4 text-gray-800 stroke-[2.5]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 0-7.5 0-10.5 0a4.5 4.5 0 00-4.5 4.5v3m0 0l3.75-3.75M4.5 18l3.75 3.75"
                  />
                </svg>
              </button>

            </div>

          </div>

          {/* Disclaimer */}
          <p className="mt-4 text-xs font-light text-gray-400/80">
            This assistant does not provide a medical diagnosis.
          </p>

        </div>


        {/* Error Message */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-800/50 bg-red-950/40 p-4 text-sm text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}


        {/* Loading Indicator */}
        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-gray-700/60 bg-[#21292d]/90 px-5 py-4 shadow-2xl backdrop-blur-md">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-[#00a884]" />
              <span className="text-sm font-light text-gray-300">
                Analyzing your symptoms...
              </span>
            </div>
          </div>
        )}


        {/* Results Display */}
        {result && !loading && (
          <div className="mt-12 space-y-6">

            {/* Results Header */}
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-normal tracking-wide text-gray-100">
                Health Information
              </h2>
              <p className="text-sm font-light text-gray-400">
                Information generated using your symptoms and medical knowledge sources.
              </p>
            </div>


            {/* Possible Conditions */}
            <ResultSection
              title="Possible Conditions"
              items={result.conditions}
            />


            {/* Common Causes */}
            <ResultSection
              title="Common Causes"
              items={result.common_causes}
            />


            {/* Home Care */}
            <ResultSection
              title="Home Care"
              items={result.home_care}
            />


            {/* Medical Advice */}
            <ResultSection
              title="When to Seek Medical Advice"
              items={result.when_to_seek_medical_advice}
            />


            {/* Emergency Signs */}
            <ResultSection
              title="Emergency Signs"
              items={result.emergency_signs}
              emergency
            />


            {/* Medical Disclaimer */}
            {result.disclaimer && (
              <div className="rounded-2xl border border-amber-800/40 bg-amber-950/30 p-6 backdrop-blur-md">
                <h3 className="font-medium tracking-wide text-amber-400">
                  Medical Disclaimer
                </h3>
                <p className="mt-2 text-sm font-light leading-6 text-amber-200/80">
                  {result.disclaimer}
                </p>
              </div>
            )}


            {/* Medical Sources */}
            <SourceList
              sources={result.sources}
            />

          </div>
        )}

      </div>
    </div>
  );
}

export default SymptomChecker;