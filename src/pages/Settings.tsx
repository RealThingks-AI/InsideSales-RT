import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  User, 
  Key, 
  Bell, 
  Palette, 
  Users, 
  UserCog, 
  Activity,
  Settings2,
  GitBranch,
  FileUp,
  Plug,
  FileText,
  Monitor,
  Shield
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import UserManagement from "@/components/UserManagement";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AuditLogsSettings from "@/components/settings/AuditLogsSettings";
import PageAccessSettings from "@/components/settings/PageAccessSettings";
import BackupRestoreSettings from "@/components/settings/BackupRestoreSettings";
import EmailTemplatesSettings from "@/components/settings/EmailTemplatesSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import DisplaySettings from "@/components/settings/DisplaySettings";
import PipelineSettings from "@/components/settings/PipelineSettings";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import SessionManagementSettings from "@/components/settings/SessionManagementSettings";
import { useUserRole } from "@/hooks/useUserRole";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Personal Settings",
    items: [
      { id: "profile", label: "Profile Management", icon: User },
      { id: "password-security", label: "Password & Security", icon: Key },
      { id: "notifications", label: "Notification Preferences", icon: Bell },
      { id: "display", label: "Display Preferences", icon: Palette },
    ],
  },
  {
    title: "User Management",
    items: [
      { id: "user-directory", label: "User Directory", icon: Users, adminOnly: true },
      { id: "role-management", label: "Role Management", icon: UserCog, adminOnly: true },
      { id: "page-access", label: "Page Access Control", icon: Activity, adminOnly: true },
    ],
  },
  {
    title: "System Config",
    items: [
      { id: "pipeline", label: "Pipeline/Stage Management", icon: GitBranch, adminOnly: true },
      { id: "email-templates", label: "Email Templates", icon: FileText, adminOnly: true },
      { id: "backup", label: "Data Import/Export", icon: FileUp, adminOnly: true },
      { id: "integrations", label: "Integration Settings", icon: Plug, adminOnly: true },
    ],
  },
  {
    title: "Security",
    items: [
      { id: "audit-logs", label: "Audit Logs Viewer", icon: Shield, adminOnly: true },
      { id: "session-management", label: "Session Management", icon: Monitor },
    ],
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { userRole } = useUserRole();
  const isAdmin = userRole === "admin";

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "password-security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "display":
        return <DisplaySettings />;
      case "user-directory":
      case "role-management":
        return <UserManagement />;
      case "page-access":
        return <PageAccessSettings />;
      case "pipeline":
        return <PipelineSettings />;
      case "email-templates":
        return <EmailTemplatesSettings />;
      case "backup":
        return <BackupRestoreSettings />;
      case "integrations":
        return <IntegrationSettings />;
      case "audit-logs":
        return <AuditLogsSettings />;
      case "session-management":
        return <SessionManagementSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  const getActiveLabel = () => {
    for (const section of menuSections) {
      const item = section.items.find((item) => item.id === activeTab);
      if (item) return item.label;
    }
    return "Settings";
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 h-16 flex items-center border-b w-full">
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">{getActiveLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r bg-muted/30 flex-shrink-0">
          <ScrollArea className="h-full py-4">
            <div className="px-3 space-y-6">
              {menuSections.map((section, sectionIndex) => {
                const visibleItems = section.items.filter(
                  (item) => !item.adminOnly || isAdmin
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.title}>
                    {sectionIndex > 0 && <Separator className="mb-4" />}
                    <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                              activeTab === item.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;