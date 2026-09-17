import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function HealthVault() {
  const [profile, setProfile] = useState({
    blood_group: "",
    allergies: "",
    medical_history: "",
  });

  const [records, setRecords] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [recordType, setRecordType] = useState("prescription");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/health-vault/profile`
      );

      const data = await response.json();

      if (data.profile) {
        setProfile({
          blood_group: data.profile.blood_group || "",
          allergies: data.profile.allergies || "",
          medical_history:
            data.profile.medical_history || "",
        });
      }
    } catch (err) {
      console.error("Profile loading error:", err);
      setError("Unable to load health profile.");
    }
  };

  // =====================================================
  // LOAD RECORDS
  // =====================================================

  const loadRecords = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/health-vault/records`
      );

      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error("Records loading error:", err);
      setError("Unable to load health records.");
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProfile();
    loadRecords();
  }, []);

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "blood_group",
        profile.blood_group
      );

      formData.append(
        "allergies",
        profile.allergies
      );

      formData.append(
        "medical_history",
        profile.medical_history
      );

      const response = await fetch(
        `${API_URL}/api/health-vault/profile`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to save profile."
        );
      }

      setMessage(
        "Health profile saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save health profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPLOAD RECORD
  // =====================================================

  const uploadRecord = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "record_type",
        recordType
      );

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API_URL}/api/health-vault/records`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to upload record."
        );
      }

      setMessage(
        "Health record uploaded successfully."
      );

      setSelectedFile(null);

      event.target.reset();

      await loadRecords();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to upload health record."
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // DELETE RECORD
  // =====================================================

  const deleteRecord = async (recordId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/health-vault/records/${recordId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to delete record."
        );
      }

      setMessage(
        "Health record deleted successfully."
      );

      await loadRecords();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete record."
      );
    }
  };

  // =====================================================
  // FORMAT RECORD TYPE
  // =====================================================

  const formatRecordType = (type) => {
    const types = {
      prescription: "Prescription",
      lab_report: "Lab Report",
      xray: "X-Ray",
      other: "Other",
    };

    return types[type] || type;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="min-h-screen px-4 py-8 text-gray-100"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, #175453 0%, #152c33 45%, #10191e 85%, #0b1114 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-normal tracking-wide text-gray-100 md:text-4xl">
            Health Vault
          </h1>
          <p className="mt-2 text-sm font-light text-gray-400">
            Store and manage your medical profile and health records securely.
          </p>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-6 rounded-xl border border-emerald-800/50 bg-emerald-950/40 p-4 text-sm font-light text-emerald-300 backdrop-blur-md">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-800/50 bg-red-950/40 p-4 text-sm font-light text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        {/* HEALTH PROFILE */}
        <form onSubmit={saveProfile}>
          <div className="mb-8 rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-normal tracking-wide text-gray-100">
                Health Profile
              </h2>
              <p className="mt-1 text-xs font-light text-gray-400">
                Keep your basic health details up to date.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Blood Group */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
                  Blood Group
                </label>
                <select
                  value={profile.blood_group}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      blood_group: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-700/80 bg-[#161d20] px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-gray-500"
                >
                  <option value="" className="bg-[#161d20] text-gray-400">
                    Select blood group
                  </option>
                  <option value="A+" className="bg-[#161d20]">A+</option>
                  <option value="A-" className="bg-[#161d20]">A-</option>
                  <option value="B+" className="bg-[#161d20]">B+</option>
                  <option value="B-" className="bg-[#161d20]">B-</option>
                  <option value="AB+" className="bg-[#161d20]">AB+</option>
                  <option value="AB-" className="bg-[#161d20]">AB-</option>
                  <option value="O+" className="bg-[#161d20]">O+</option>
                  <option value="O-" className="bg-[#161d20]">O-</option>
                </select>
              </div>

              {/* Allergies */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
                  Allergies
                </label>
                <input
                  type="text"
                  value={profile.allergies}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      allergies: e.target.value,
                    })
                  }
                  placeholder="e.g. Penicillin, Dust, Peanuts"
                  className="w-full rounded-xl border border-gray-700/80 bg-[#161d20] px-4 py-3 text-sm font-light text-gray-200 placeholder-gray-500 outline-none transition focus:border-gray-500"
                />
              </div>
            </div>

            {/* Medical History */}
            <div className="mt-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
                Medical History
              </label>
              <textarea
                rows="4"
                value={profile.medical_history}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    medical_history: e.target.value,
                  })
                }
                placeholder="Enter past conditions, surgeries, or underlying conditions..."
                className="w-full resize-none rounded-xl border border-gray-700/80 bg-[#161d20] px-4 py-3 text-sm font-light text-gray-200 placeholder-gray-500 outline-none transition focus:border-gray-500"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Health Profile"}
              </button>
            </div>
          </div>
        </form>

        {/* UPLOAD RECORD */}
        <form onSubmit={uploadRecord}>
          <div className="mb-8 rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-normal tracking-wide text-gray-100">
                Upload Health Record
              </h2>
              <p className="mt-1 text-xs font-light text-gray-400">
                Upload prescriptions, lab reports, X-rays, or other medical files.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Record Type */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
                  Record Type
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#161d20] px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-gray-500"
                >
                  <option value="prescription" className="bg-[#161d20]">Prescription</option>
                  <option value="lab_report" className="bg-[#161d20]">Lab Report</option>
                  <option value="xray" className="bg-[#161d20]">X-Ray</option>
                  <option value="other" className="bg-[#161d20]">Other</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full rounded-xl border border-gray-700/80 bg-[#161d20] px-4 py-2.5 text-sm font-light text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00a884] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-950 hover:file:bg-[#008f70]"
                />
                <p className="mt-2 text-xs font-light text-gray-500">
                  Supported formats: PDF, JPG, JPEG, PNG. Max size: 10MB.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-full bg-[#00a884] px-6 py-2.5 text-sm font-medium text-gray-950 transition hover:bg-[#008f70] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Record"}
              </button>
            </div>
          </div>
        </form>

        {/* RECORDS LIST */}
        <div className="rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-normal tracking-wide text-gray-100">
              My Health Records
            </h2>
            <p className="mt-1 text-xs font-light text-gray-400">
              Access and manage your uploaded documents.
            </p>
          </div>

          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 py-12 text-center">
              <p className="text-sm font-light text-gray-400">
                No health records uploaded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-700/50 bg-[#161d20]/80 p-4 transition hover:border-gray-600 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#21292d] text-lg text-gray-200">
                      📄
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-100">
                        {record.file_name}
                      </h3>

                      <p className="text-xs font-light text-gray-400">
                        {formatRecordType(record.record_type)}
                        {" • "}
                        {formatDate(record.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`${API_URL}/api/health-vault/records/${record.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-gray-700 bg-transparent px-4 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
                    >
                      View
                    </a>

                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="rounded-full border border-red-900/50 bg-red-950/30 px-4 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-900/50 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HealthVault;