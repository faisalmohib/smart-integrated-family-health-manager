function ResultSection({
  title,
  items,
  emergency = false,
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <h3
        className={`text-lg font-bold ${
          emergency
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {title}
      </h3>

      <ul className="mt-4 space-y-3">

        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-3 text-sm leading-6 text-slate-600"
          >

            <span
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                emergency
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
            />

            <span>
              {item}
            </span>

          </li>
        ))}

      </ul>

    </div>
  );
}

export default ResultSection;