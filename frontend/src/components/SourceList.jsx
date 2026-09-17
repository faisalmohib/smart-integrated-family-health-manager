
function SourceList({ sources }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl bg-[#21292d]/90 p-6 shadow-2xl ring-1 ring-gray-700/60 backdrop-blur-md">

      <h3 className="text-lg font-medium tracking-wide text-gray-100">
        Medical Sources
      </h3>

      <div className="mt-4 space-y-3">

        {sources.map((source, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-700/50 bg-[#181f22]/80 p-4 transition-colors hover:border-gray-600"
          >

            <p className="text-sm font-medium text-gray-200">
              {source.document}
            </p>

            <div className="mt-2 flex gap-4 text-xs text-gray-400">

              <span>
                Page {source.page}
              </span>

              <span>
                Relevance: {source.relevance_score}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default SourceList;

