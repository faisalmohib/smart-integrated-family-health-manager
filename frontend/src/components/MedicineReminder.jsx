import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function MedicineReminder() {
  const [medicineName, setMedicineName] = useState("");
  const [medicineTime, setMedicineTime] = useState("");

  const [reminders, setReminders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD REMINDERS
  // =====================================================

  const loadReminders = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/medicines/reminders`
      );

      if (!response.ok) {
        throw new Error("Failed to load reminders");
      }

      const data = await response.json();

      setReminders(data.reminders || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load medicine reminders.");
    }
  };

  // =====================================================
  // LOAD ON COMPONENT START
  // =====================================================

  useEffect(() => {
    loadReminders();
  }, []);

  // =====================================================
  // ADD REMINDER
  // =====================================================

  const handleAddReminder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!medicineName.trim()) {
      setError("Please enter the medicine name.");
      return;
    }

    if (!medicineTime) {
      setError("Please select a reminder time.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/medicines/reminders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            medicine_name: medicineName.trim(),
            reminder_time: medicineTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to create reminder."
        );
      }

      setSuccess("Medicine reminder added successfully.");

      setMedicineName("");
      setMedicineTime("");

      await loadReminders();
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to create medicine reminder."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE REMINDER
  // =====================================================

  const handleDelete = async (id) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/medicines/reminders/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete reminder."
        );
      }

      setSuccess("Reminder deleted successfully.");

      await loadReminders();
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to delete reminder."
      );
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":");

    const date = new Date();

    date.setHours(
      Number(hour),
      Number(minute)
    );

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <section
      className="min-h-screen px-4 py-10 text-white"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, #175453 0%, #152c33 45%, #10191e 85%, #0b1114 100%)",
      }}
    >
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-wide text-gray-100 md:text-4xl">
            Medicine Reminder
          </h1>
          <p className="text-sm font-light text-gray-400 md:text-base">
            Set reminders for your medicines and never miss a scheduled dose.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Add Reminder Form Card */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#182328]/80 p-6 shadow-xl backdrop-blur-md">
            <h2 className="mb-5 text-lg font-medium text-gray-200">
              Add Medicine
            </h2>

            <form onSubmit={handleAddReminder} className="space-y-4">
              
              {/* Medicine Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="medicineName"
                  className="block text-xs font-medium text-gray-400"
                >
                  Medicine Name
                </label>
                <input
                  id="medicineName"
                  type="text"
                  value={medicineName}
                  onChange={(event) =>
                    setMedicineName(event.target.value)
                  }
                  placeholder="e.g. Panadol"
                  className="w-full rounded-xl border border-gray-700/80 bg-[#10171a] px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-[#00a884]"
                />
              </div>

              {/* Reminder Time */}
              <div className="space-y-1.5">
                <label
                  htmlFor="medicineTime"
                  className="block text-xs font-medium text-gray-400"
                >
                  Reminder Time
                </label>
                <input
                  id="medicineTime"
                  type="time"
                  value={medicineTime}
                  onChange={(event) =>
                    setMedicineTime(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700/80 bg-[#10171a] px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-[#00a884] [color-scheme:dark]"
                />
              </div>

              {/* Alert Messages */}
              {error && (
                <div className="rounded-xl border border-red-800/50 bg-red-950/50 px-4 py-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/50 px-4 py-3 text-xs text-emerald-300">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#00a884] px-4 py-3 text-sm font-semibold text-gray-950 shadow-lg transition hover:bg-[#008f70] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Reminder"}
              </button>
            </form>
          </div>

          {/* Saved Reminders Card */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#182328]/80 p-6 shadow-xl backdrop-blur-md">
            
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-200">
                Your Reminders
              </h2>
              <span className="rounded-full border border-[#00a884]/30 bg-[#00a884]/20 px-2.5 py-0.5 text-xs font-semibold text-[#00a884]">
                {reminders.length}
              </span>
            </div>

            {reminders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-700/80 p-6">
                <div className="text-center">
                  <div className="mb-3 text-4xl">💊</div>
                  <p className="font-medium text-gray-300">
                    No reminders yet
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Add your first medicine reminder.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between rounded-xl border border-gray-700/60 bg-[#10171a] p-4"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-gray-200">
                        {reminder.medicine_name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Every day at{" "}
                        <span className="text-[#00a884]">
                          {formatTime(reminder.time)}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="text-xs font-medium text-red-400/90 transition hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Information Banner */}
        <div className="mt-6 flex items-start space-x-3 rounded-2xl border border-[#00a884]/30 bg-[#123133]/60 p-4 text-xs md:text-sm">
          <span className="text-base leading-none">🔔</span>
          <div className="space-y-0.5">
            <h3 className="font-medium text-[#00a884]">
              Reminder Information
            </h3>
            <p className="font-light leading-relaxed text-gray-300/80">
              SIFHM will display a desktop notification when it is time to take
              your medicine. Keep the SIFHM backend running to receive scheduled
              notifications.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default MedicineReminder;