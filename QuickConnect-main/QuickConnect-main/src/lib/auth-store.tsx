import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { people, personById, type Person } from "./data";

export type RoleCategory =
  | "Outgoing Member"
  | "Incoming Member"
  | "Project Manager"
  | "Organisation Admin";

export interface RoleDefinition {
  id: RoleCategory;
  title: string;
  shortDesc: string;
  defaultMemberId: string;
  route: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<RoleCategory, RoleDefinition> = {
  "Outgoing Member": {
    id: "Outgoing Member",
    title: "Outgoing Member",
    shortDesc: "Transfers project knowledge & prepares handovers",
    defaultMemberId: "alex",
    route: "/handovers",
    permissions: ["create_handover", "export_docs", "assign_topics"],
  },
  "Incoming Member": {
    id: "Incoming Member",
    title: "Incoming Member",
    shortDesc: "Receives handovers & completes AI verification",
    defaultMemberId: "priya",
    route: "/verification",
    permissions: ["verify_knowledge", "ask_ai", "view_assigned_projects"],
  },
  "Project Manager": {
    id: "Project Manager",
    title: "Project Manager",
    shortDesc: "Reviews handovers, monitors gaps & checks readiness",
    defaultMemberId: "arjun",
    route: "/readiness",
    permissions: ["approve_handovers", "audit_gaps", "track_milestones"],
  },
  "Organisation Admin": {
    id: "Organisation Admin",
    title: "Organisation Admin",
    shortDesc: "Manages users, permissions & organisation settings",
    defaultMemberId: "christy",
    route: "/",
    permissions: ["manage_users", "manage_sources", "configure_ai", "all"],
  },
};

export function getRoleCategoryForPerson(p: Person): RoleCategory {
  if (p.id === "alex") return "Outgoing Member";
  if (p.id === "priya") return "Incoming Member";
  if (p.id === "arjun" || p.id === "david") return "Project Manager";
  if (p.id === "christy") return "Organisation Admin";
  if (p.role.toLowerCase().includes("outgoing")) return "Outgoing Member";
  if (p.role.toLowerCase().includes("incoming")) return "Incoming Member";
  if (p.role.toLowerCase().includes("manager") || p.role.toLowerCase().includes("lead")) return "Project Manager";
  if (p.role.toLowerCase().includes("admin")) return "Organisation Admin";
  return "Incoming Member";
}

interface AuthState {
  user: Person;
  roleCategory: RoleCategory;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    emailOrUsername: string,
    password: string,
    targetRole?: RoleCategory
  ) => Promise<{
    success: boolean;
    error?: string;
    actualRole?: RoleCategory;
    roleMismatch?: boolean;
    redirectRoute: string;
  }>;
  loginWithGoogle: (targetRole?: RoleCategory) => Promise<{
    success: boolean;
    redirectRoute: string;
  }>;
  logout: () => void;
  switchUser: (personId: string) => void;
}

const AUTH_STORAGE_KEY = "quickconnect.auth.session.v1";
const DEFAULT_USER_ID = "christy";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Person>(() => personById(DEFAULT_USER_ID));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.userId) {
          const found = people.find((p) => p.id === parsed.userId);
          if (found) {
            setUser(found);
            setIsAuthenticated(parsed.isAuthenticated ?? true);
          }
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  const saveSession = (person: Person, authed: boolean) => {
    setUser(person);
    setIsAuthenticated(authed);
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ userId: person.id, isAuthenticated: authed, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
  };

  const roleCategory = getRoleCategoryForPerson(user);

  const login = async (
    emailOrUsername: string,
    password: string,
    targetRole?: RoleCategory
  ) => {
    // Artificial small delay for realistic authentication feel
    await new Promise((r) => setTimeout(r, 450));

    const query = emailOrUsername.trim().toLowerCase();
    if (!query) {
      return {
        success: false,
        error: "Please enter your email or username.",
        redirectRoute: "/login",
      };
    }

    if (!password) {
      return {
        success: false,
        error: "Please enter your password.",
        redirectRoute: "/login",
      };
    }

    // Match against real people directory
    const matchedPerson = people.find(
      (p) =>
        p.email.toLowerCase() === query ||
        p.id.toLowerCase() === query ||
        p.name.toLowerCase().includes(query)
    );

    if (!matchedPerson) {
      return {
        success: false,
        error: "Account not found. Please check your credentials or contact your administrator.",
        redirectRoute: "/login",
      };
    }

    // Passwords for demo/team members: any password >= 4 chars or "quickconnect", "password", etc.
    if (password.length < 4) {
      return {
        success: false,
        error: "Password must be at least 4 characters.",
        redirectRoute: "/login",
      };
    }

    // Determine actual role
    const actualRole = getRoleCategoryForPerson(matchedPerson);
    const roleMismatch = targetRole && targetRole !== actualRole;

    saveSession(matchedPerson, true);

    const redirectRoute = ROLE_DEFINITIONS[actualRole]?.route || "/";

    return {
      success: true,
      actualRole,
      roleMismatch: !!roleMismatch,
      redirectRoute,
    };
  };

  const loginWithGoogle = async (targetRole?: RoleCategory) => {
    await new Promise((r) => setTimeout(r, 550));
    // Default to the target role's representative member or Christy
    const targetDef = targetRole ? ROLE_DEFINITIONS[targetRole] : null;
    const targetMember = targetDef
      ? personById(targetDef.defaultMemberId)
      : personById(DEFAULT_USER_ID);

    saveSession(targetMember, true);
    const redirectRoute = targetDef ? targetDef.route : "/";
    return { success: true, redirectRoute };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const switchUser = (personId: string) => {
    const p = people.find((x) => x.id === personId);
    if (p) {
      saveSession(p, true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleCategory,
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
