import Image from "next/image";
import { SetupForm } from "./setup-form";
import { checkSetupStatus } from "./action";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const isEmpty = await checkSetupStatus();
  if (!isEmpty) redirect("/");
  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-slate-100 dark:bg-slate-950">
      {/* LEFT SIDE - BRANDING / IMAGE */}
      <div className="hidden md:flex relative bg-linear-to-br from-indigo-600 to-purple-700">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2850&auto=format&fit=crop"
          alt="Team collaboration"
          fill
          className="object-cover mix-blend-overlay opacity-40"
          priority
        />

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              Welcome to Ark LMS
            </h1>
            <p className="text-lg text-indigo-100">
              Set up your administrator account to start managing your classes,
              students, and educational content in one unified platform.
            </p>

            {/* Feature List */}
            <ul className="space-y-4 pt-4">
              <li className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  Complete Class Management
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  Real-time Student Tracking
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Secure Gradebook</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
