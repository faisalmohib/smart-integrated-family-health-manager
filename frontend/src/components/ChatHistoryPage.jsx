import { useEffect, useState } from "react";
import { Trash2, MessageSquare, Calendar, User } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

export default function ChatHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/chat-history/`);

      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await response.json();

      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load chat history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteChat = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/chat-history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      setHistory((previous) => previous.filter((chat) => chat.id !== id));
    } catch (err) {
      console.error(err);
      alert("Unable to delete this conversation.");
    }
  };

  const deleteAllHistory = async () => {
    if (history.length === 0) return;

    const confirmed = window.confirm("Delete all chat history?");

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/chat-history/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete history");
      }

      setHistory([]);
    } catch (err) {
      console.error(err);
      alert("Unable to delete chat history.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getAnswer = (answer) => {
    try {
      return JSON.parse(answer);
    } catch {
      return null;
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-8 text-gray-100 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, #175453 0%, #152c33 45%, #10191e 85%, #0b1114 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00a884]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#00a884]">
                SIFHM
              </span>
            </div>

            <h1 className="text-3xl font-normal tracking-wide text-gray-100 md:text-4xl">
              Chat History
            </h1>

            <p className="mt-2 text-sm font-light text-gray-400">
              Review your previous AI symptom consultations.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={deleteAllHistory}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-900/50 bg-red-950/30 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-900/50 hover:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-[#00a884]"></div>

            <p className="text-sm font-light text-gray-400">
              Loading chat history...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-6 text-center backdrop-blur-md">
            <p className="text-sm font-light text-red-300">{error}</p>

            <button
              onClick={fetchHistory}
              className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && history.length === 0 && (
          <div className="rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#161d20] border border-gray-700/80">
              <MessageSquare className="h-8 w-8 text-[#00a884]" />
            </div>

            <h2 className="text-xl font-normal tracking-wide text-gray-100">
              No Chat History
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs font-light text-gray-400">
              Your previous symptom checker conversations will appear here.
            </p>
          </div>
        )}

        {/* History */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-6">
            {history.map((chat) => {
              const answer = getAnswer(chat.answer);

              return (
                <div
                  key={chat.id}
                  className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#21292d]/80 shadow-2xl backdrop-blur-md"
                >
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-gray-700/50 bg-[#161d20]/90 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#21292d] text-[#00a884] border border-gray-700/60">
                        <User className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-100">
                          Symptom Consultation
                        </p>

                        <div className="mt-0.5 flex items-center gap-1.5 text-xs font-light text-gray-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(chat.date)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteChat(chat.id)}
                      title="Delete conversation"
                      className="rounded-full p-2 text-gray-400 transition hover:bg-red-950/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Question */}
                  <div className="px-6 py-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#00a884]">
                      Your Symptoms
                    </p>

                    <div className="rounded-xl border border-gray-700/50 bg-[#161d20] p-4 text-sm font-light text-gray-200">
                      {chat.question}
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="border-t border-gray-700/50 px-6 py-5">
                    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-emerald-400">
                      AI Response
                    </p>

                    {answer ? (
                      <div className="space-y-5 text-sm font-light text-gray-300">
                        {/* Conditions */}
                        {answer.conditions?.length > 0 && (
                          <section>
                            <h3 className="mb-2 text-sm font-medium text-gray-100">
                              Possible Illness
                            </h3>

                            <ul className="list-disc space-y-1 pl-5 text-xs text-gray-300">
                              {answer.conditions.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Causes */}
                        {answer.common_causes?.length > 0 && (
                          <section>
                            <h3 className="mb-2 text-sm font-medium text-gray-100">
                              Common Causes
                            </h3>

                            <ul className="list-disc space-y-1 pl-5 text-xs text-gray-300">
                              {answer.common_causes.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Home Care */}
                        {answer.home_care?.length > 0 && (
                          <section>
                            <h3 className="mb-2 text-sm font-medium text-gray-100">
                              Home Care
                            </h3>

                            <ul className="list-disc space-y-1 pl-5 text-xs text-gray-300">
                              {answer.home_care.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Medical Advice */}
                        {answer.when_to_seek_medical_advice?.length > 0 && (
                          <section>
                            <h3 className="mb-2 text-sm font-medium text-gray-100">
                              When to See a Doctor
                            </h3>

                            <ul className="list-disc space-y-1 pl-5 text-xs text-gray-300">
                              {answer.when_to_seek_medical_advice.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                )
                              )}
                            </ul>
                          </section>
                        )}

                        {/* Emergency */}
                        {answer.emergency_signs?.length > 0 && (
                          <section className="rounded-xl border border-red-800/50 bg-red-950/30 p-4">
                            <h3 className="mb-2 text-sm font-medium text-red-300">
                              Emergency Signs
                            </h3>

                            <ul className="list-disc space-y-1 pl-5 text-xs text-red-300">
                              {answer.emergency_signs.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Disclaimer */}
                        {answer.disclaimer && (
                          <div className="border-t border-gray-700/50 pt-4 text-xs font-light leading-relaxed text-gray-400">
                            <strong className="font-medium text-gray-300">
                              Disclaimer:
                            </strong>{" "}
                            {answer.disclaimer}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-light text-gray-300">
                        {chat.answer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}