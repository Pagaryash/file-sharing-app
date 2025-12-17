export default function AuthShell({ title, children }) {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Center container */}
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10">
        {/* Card */}
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Please enter your details below.
          </p>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
