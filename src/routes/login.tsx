import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type RoleCategory } from "@/lib/auth-store";
import { personById } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In" },
      {
        name: "description",
        content: "Sign in to continue to your workspace.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();

  // State
  const [selectedRole, setSelectedRole] = useState<RoleCategory>("Organisation Admin");
  const [emailOrUsername, setEmailOrUsername] = useState("christy@quickflow.io");
  const [password, setPassword] = useState("quickflow123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialogs
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Password reset flow
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Contact admin flow
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Handle role selection
  const handleSelectRole = (role: RoleCategory) => {
    setSelectedRole(role);
    setErrorMessage(null);

    const def = ROLE_DEFINITIONS[role];
    const member = personById(def.defaultMemberId);
    if (member) {
      setEmailOrUsername(member.email);
      setPassword("quickflow123");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(emailOrUsername, password, selectedRole);

      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      if (result.roleMismatch && result.actualRole) {
        toast.warning(
          `Account verified as ${result.actualRole}. Elevated permissions to ${selectedRole} were denied.`,
          {
            description: `Redirecting to your authorized ${result.actualRole} workspace.`,
            duration: 4000,
          }
        );
      } else {
        toast.success(`Welcome back, ${emailOrUsername.split("@")[0]}!`, {
          description: `Logged in with ${result.actualRole} permissions.`,
        });
      }

      setTimeout(() => {
        navigate({ to: result.redirectRoute });
      }, 350);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async (targetRole?: RoleCategory) => {
    setIsLoading(true);
    setShowGoogleModal(false);
    try {
      const result = await loginWithGoogle(targetRole || selectedRole);
      toast.success("Signed in with Google Workspace", {
        description: "Your team credentials have been securely verified.",
      });
      setTimeout(() => {
        navigate({ to: result.redirectRoute });
      }, 350);
    } catch {
      toast.error("Google authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Please enter a valid work email address.");
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetSent(true);
      toast.success("Password reset instructions dispatched!");
    }, 700);
  };

  // Handle Contact Admin
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactEmail.includes("@")) {
      toast.error("Please enter a valid work email address.");
      return;
    }
    setContactSent(true);
    toast.success("Access request delivered to Christy Francis (Administrator).");
  };

  return (
    <div className="flex min-h-screen min-h-[100svh] w-full flex-col overflow-y-auto bg-[#F7F3ED] bg-cover bg-center bg-no-repeat text-[#292929] selection:bg-[#C2A064]/20 lg:h-screen lg:overflow-hidden lg:flex-row font-sans" style={{ backgroundImage: "url('/images/knowflow-login-bg.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      {/* =========================================================================
          LOGIN PANEL — supplied image fills the entire viewport behind the form.
          Place the original image at public/images/knowflow-login-bg.png.
          The image scales proportionally to cover the full browser window without stretching. On desktop the viewport stays fixed; on mobile it scrolls smoothly if content exceeds height.
      ========================================================================= */}
      <div className="flex min-h-full w-full flex-col justify-between px-4 py-5 sm:px-8 sm:py-6 md:px-12 lg:h-full lg:flex-1 lg:min-w-0 lg:overflow-y-auto lg:px-9 lg:py-6 xl:px-12">
        {/* Center content container */}
        <div className="my-auto w-full max-w-md px-5 py-8 sm:translate-x-3 sm:px-7 lg:translate-x-6 lg:px-8">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight text-[#252525] sm:text-4xl">Login</h1>
          </div>
          {/* =====================================================================
              LOGIN FORM: Clean, premium sign-in layout
          ===================================================================== */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                <span className="truncate flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Email input */}
            <div className="space-y-1">
              <label
                htmlFor="login-email"
                className="block text-[13px] font-semibold tracking-[0.01em] text-[#343434]"
              >
                Work Email or Username
              </label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                required
                placeholder="name@quickflow.io or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C8] bg-white/95 px-4 py-3.5 text-sm text-[#252525] placeholder:text-gray-400 shadow-sm transition focus:border-[#A98A52] focus:outline-none focus:ring-2 focus:ring-[#C2A064]/20"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-semibold text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-medium text-[#8A7048] transition hover:text-[#252525] hover:underline hover:underline-offset-4"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C8] bg-white/95 py-3.5 pl-4 pr-11 text-sm text-[#252525] placeholder:text-gray-400 shadow-sm transition focus:border-[#A98A52] focus:outline-none focus:ring-2 focus:ring-[#C2A064]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl bg-[#292929] py-3.5 text-sm font-semibold tracking-wide text-white shadow-md shadow-black/10 transition duration-200 hover:bg-[#171717] active:scale-[0.99] disabled:opacity-70",
                  isLoading && "cursor-wait"
                )}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider & Social */}
          <div className="mt-7">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#D8D2C8]" />
              <span className="shrink-0 text-xs font-medium text-[#827D74]">or continue with</span>
              <div className="h-px flex-1 bg-[#D8D2C8]" />
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              {/* Google */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                aria-label="Sign in with Google Workspace"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DED8CE] bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B79A66] hover:shadow-md active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={() => {
                  toast.info("Microsoft Single Sign-On", {
                    description: "Select Google Workspace or email credentials in this environment.",
                  });
                }}
                aria-label="Sign in with Microsoft Work Account"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DED8CE] bg-white/95 text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B79A66] hover:shadow-md active:scale-95"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              </button>

              {/* Enterprise SSO */}
              <button
                type="button"
                onClick={() => {
                  toast.info("Enterprise SAML / Okta SSO", {
                    description: "Contact your organisation administrator for SAML federation.",
                  });
                }}
                aria-label="Sign in with Enterprise SSO"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DED8CE] bg-white/95 text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B79A66] hover:shadow-md active:scale-95"
              >
                <Building2 className="h-4 w-4 text-[#252525]" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="pt-4 text-center text-xs text-[#625D55]">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={() => setShowContactAdmin(true)}
            className="font-semibold text-[#8A7048] underline decoration-[#B79A66]/60 underline-offset-4 transition hover:text-[#252525]"
          >
            Contact your organisation admin
          </button>
        </div>
      </div>

      {/* =========================================================================
          FORGOT PASSWORD DIALOG
      ========================================================================= */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-[#252525]">
                <Lock className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#252525]">Reset Password</h3>
              <p className="mt-1 text-xs text-gray-500">
                Enter your work email and we will dispatch a secure password reset link.
              </p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. christy@quickflow.io"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-1 w-full rounded-full border border-gray-200 px-3.5 py-2 text-xs focus:border-[#252525] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-full bg-[#252525] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#151515] transition disabled:opacity-50"
                  >
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
                <p className="mt-2 text-xs font-semibold text-emerald-900">
                  Instructions Dispatched
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  If an account exists for {resetEmail}, a reset token was sent.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-3 rounded-full bg-emerald-800 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-900"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTACT ADMIN DIALOG
      ========================================================================= */}
      {showContactAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-[#252525]">
                <Building2 className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowContactAdmin(false);
                  setContactSent(false);
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#252525]">
                Request QuickFlow Access
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Routed to Christy Francis (Administrator).
              </p>
            </div>

            {!contactSent ? (
              <form onSubmit={handleContactSubmit} className="mt-3.5 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya S."
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-0.5 w-full rounded-full border border-gray-200 px-3.5 py-2 text-xs focus:border-[#252525] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="maya@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-0.5 w-full rounded-full border border-gray-200 px-3.5 py-2 text-xs focus:border-[#252525] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Intended Role / Team
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RoleCategory)}
                    className="mt-0.5 w-full rounded-full border border-gray-200 px-3.5 py-2 text-xs focus:border-[#252525] focus:outline-none bg-white"
                  >
                    <option value="Incoming Member">Incoming Member (Engineering / QA)</option>
                    <option value="Outgoing Member">Outgoing Member (Handover preparation)</option>
                    <option value="Project Manager">Project Manager (Oversight & approvals)</option>
                    <option value="Organisation Admin">Organisation Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Note for Administrator (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Joining the team next sprint..."
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    className="mt-0.5 w-full rounded-2xl border border-gray-200 p-2.5 text-xs focus:border-[#252525] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowContactAdmin(false)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#252525] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#151515] transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
                <p className="mt-2 text-xs font-semibold text-emerald-900">
                  Request Dispatched!
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Administrator notified. Check your inbox for account confirmation.
                </p>
                <button
                  type="button"
                  onClick={() => setShowContactAdmin(false)}
                  className="mt-3 rounded-full bg-emerald-800 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-900"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          GOOGLE SSO MODAL
      ========================================================================= */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl animate-in zoom-in-95 sm:p-6">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold text-gray-800">
                  Sign in with Google Workspace
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2.5 text-[11px] text-gray-500">
              Select an authorized QuickFlow team account:
            </p>

            <div className="mt-3 space-y-1.5">
              {[
                { person: personById("christy"), role: "Organisation Admin" as RoleCategory },
                { person: personById("arjun"), role: "Project Manager" as RoleCategory },
                { person: personById("priya"), role: "Incoming Member" as RoleCategory },
                { person: personById("alex"), role: "Outgoing Member" as RoleCategory },
              ].map(({ person, role }) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleGoogleLogin(role)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-gray-100 p-2 text-left transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <img
                    src={person.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover shadow-2xs"
                    style={{ backgroundColor: person.bgColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[#252525]">
                      {person.name}
                    </span>
                    <span className="block truncate text-[10px] text-gray-500">
                      {person.email}
                    </span>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9.5px] font-medium text-gray-600">
                    {role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
