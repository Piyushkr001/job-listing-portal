// app/dashboard/settings/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Settings2,
    Bell,
    ShieldCheck,
    Palette,
    Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group";

type Role = "candidate" | "employer";
type Theme = "system" | "light" | "dark";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type SettingsResponse = {
    jobAlertsEmail: boolean;
    jobAlertsPush: boolean;
    activityEmails: boolean;
    marketingEmails: boolean;
    loginAlerts: boolean;
    twoFactor: boolean;
    theme: Theme;
};

export default function SettingsPage() {
    const router = useRouter();

    const [role, setRole] = React.useState<Role | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Notification preferences
    const [jobAlertsEmail, setJobAlertsEmail] = React.useState(true);
    const [jobAlertsPush, setJobAlertsPush] = React.useState(true);
    const [activityEmails, setActivityEmails] = React.useState(true);
    const [marketingEmails, setMarketingEmails] = React.useState(false);

    // Security preferences
    const [loginAlerts, setLoginAlerts] = React.useState(true);
    const [twoFactor, setTwoFactor] = React.useState(false);

    // UI preferences
    const [theme, setTheme] = React.useState<Theme>("system");

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            router.replace("/login");
            return;
        }

        const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
        if (!storedRole) {
            router.replace("/dashboard");
            return;
        }

        setRole(storedRole);

        let cancelled = false;

        const loadSettings = async () => {
            try {
                const { data } = await axios.get<SettingsResponse>("/api/settings", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (cancelled) return;

                setJobAlertsEmail(data.jobAlertsEmail);
                setJobAlertsPush(data.jobAlertsPush);
                setActivityEmails(data.activityEmails);
                setMarketingEmails(data.marketingEmails);
                setLoginAlerts(data.loginAlerts);
                setTwoFactor(data.twoFactor);
                setTheme(data.theme);
            } catch (error) {
                console.error("[Settings] load error:", error);
                // We can keep defaults if it fails
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadSettings();
        return () => {
            cancelled = true;
        };
    }, [router]);

    const handleSave = async () => {
        try {
            setSaving(true);

            const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                router.replace("/login");
                return;
            }

            const payload: SettingsResponse = {
                jobAlertsEmail,
                jobAlertsPush,
                activityEmails,
                marketingEmails,
                loginAlerts,
                twoFactor,
                theme,
            };

            const { data } = await axios.patch<SettingsResponse>(
                "/api/settings",
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // sync back in case backend normalizes anything
            setJobAlertsEmail(data.jobAlertsEmail);
            setJobAlertsPush(data.jobAlertsPush);
            setActivityEmails(data.activityEmails);
            setMarketingEmails(data.marketingEmails);
            setLoginAlerts(data.loginAlerts);
            setTwoFactor(data.twoFactor);
            setTheme(data.theme);

            toast.success("Settings saved successfully.");
        } catch (error) {
            console.error("[Settings] save error:", error);
            toast.error("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !role) {
        return (
            <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
                <div className="h-24 rounded-xl bg-muted animate-pulse" />
                <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
                    <div className="h-72 rounded-xl bg-muted animate-pulse" />
                    <div className="h-72 rounded-xl bg-muted animate-pulse" />
                </div>
            </div>
        );
    }

    const isCandidate = role === "candidate";

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <SettingsHeader role={role} saving={saving} onSave={handleSave} />

            <div className="flex flex-col gap-4 lg:flex-row">
                {/* LEFT COLUMN */}
                <div className="flex w-full flex-1 flex-col gap-4">
                    <NotificationsCard
                        isCandidate={isCandidate}
                        jobAlertsEmail={jobAlertsEmail}
                        setJobAlertsEmail={setJobAlertsEmail}
                        jobAlertsPush={jobAlertsPush}
                        setJobAlertsPush={setJobAlertsPush}
                        activityEmails={activityEmails}
                        setActivityEmails={setActivityEmails}
                        marketingEmails={marketingEmails}
                        setMarketingEmails={setMarketingEmails}
                    />

                    <SecurityCard
                        loginAlerts={loginAlerts}
                        setLoginAlerts={setLoginAlerts}
                        twoFactor={twoFactor}
                        setTwoFactor={setTwoFactor}
                    />
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-sm">
                    <AppearanceCard theme={theme} setTheme={setTheme} />
                    <DangerZoneCard />
                </div>
            </div>
        </div>
    );
}

/* ---------- HEADER ---------- */

function SettingsHeader({
    role,
    saving,
    onSave,
}: {
    role: Role;
    saving: boolean;
    onSave: () => void;
}) {
    const isCandidate = role === "candidate";

    return (
        <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
                    <Settings2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                        Settings
                    </h1>
                    <p className="text-xs text-muted-foreground md:text-sm">
                        {isCandidate
                            ? "Fine-tune how HireOrbit works for you as a candidate."
                            : "Configure preferences for your hiring workspace."}
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {isCandidate ? "Candidate account" : "Employer account"}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                            Changes apply across your entire dashboard.
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-start md:justify-end">
                <Button
                    type="button"
                    onClick={onSave}
                    size="sm"
                    className="inline-flex items-center gap-2 rounded-full"
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>
        </header>
    );
}

/* ---------- NOTIFICATIONS CARD ---------- */

function NotificationsCard({
    isCandidate,
    jobAlertsEmail,
    setJobAlertsEmail,
    jobAlertsPush,
    setJobAlertsPush,
    activityEmails,
    setActivityEmails,
    marketingEmails,
    setMarketingEmails,
}: {
    isCandidate: boolean;
    jobAlertsEmail: boolean;
    setJobAlertsEmail: (v: boolean) => void;
    jobAlertsPush: boolean;
    setJobAlertsPush: (v: boolean) => void;
    activityEmails: boolean;
    setActivityEmails: (v: boolean) => void;
    marketingEmails: boolean;
    setMarketingEmails: (v: boolean) => void;
}) {
    return (
        <Card className="border bg-background shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                </div>
                <div>
                    <CardTitle className="text-sm font-semibold">
                        Notifications
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Control how HireOrbit contacts you about jobs and activity.
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Job alerts */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Job alerts
                    </p>
                    <div className="flex flex-col gap-3">
                        <SettingRow
                            label={
                                isCandidate
                                    ? "Email alerts for matching jobs"
                                    : "Email alerts for new applicants"
                            }
                            description={
                                isCandidate
                                    ? "Get notified when new roles match your preferences."
                                    : "Get notified when candidates apply to your jobs."
                            }
                        >
                            <Switch
                                checked={jobAlertsEmail}
                                onCheckedChange={setJobAlertsEmail}
                            />
                        </SettingRow>

                        <SettingRow
                            label="Push-style in-app notifications"
                            description="Show notifications inside your dashboard for important updates."
                        >
                            <Switch
                                checked={jobAlertsPush}
                                onCheckedChange={setJobAlertsPush}
                            />
                        </SettingRow>
                    </div>
                </div>

                <Separator />

                {/* Activity & marketing */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Activity & updates
                    </p>
                    <div className="flex flex-col gap-3">
                        <SettingRow
                            label="Account & security emails"
                            description="Receive updates about logins, password changes, and security alerts."
                        >
                            <Switch
                                checked={activityEmails}
                                onCheckedChange={setActivityEmails}
                            />
                        </SettingRow>

                        <SettingRow
                            label="Product tips & announcements"
                            description="Occasional emails about new features and best practices."
                        >
                            <Switch
                                checked={marketingEmails}
                                onCheckedChange={setMarketingEmails}
                            />
                        </SettingRow>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------- SECURITY CARD ---------- */

function SecurityCard({
    loginAlerts,
    setLoginAlerts,
    twoFactor,
    setTwoFactor,
}: {
    loginAlerts: boolean;
    setLoginAlerts: (v: boolean) => void;
    twoFactor: boolean;
    setTwoFactor: (v: boolean) => void;
}) {
    return (
        <Card className="border bg-background shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                    <CardTitle className="text-sm font-semibold">
                        Security
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Keep your account secure and stay informed about suspicious activity.
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <SettingRow
                        label="Login alerts"
                        description="Email me when there is a sign-in from a new device or location."
                    >
                        <Switch
                            checked={loginAlerts}
                            onCheckedChange={setLoginAlerts}
                        />
                    </SettingRow>

                    <SettingRow
                        label="Two-factor authentication"
                        description="Add an extra verification step when signing in. (Coming soon)"
                    >
                        <Switch
                            checked={twoFactor}
                            onCheckedChange={setTwoFactor}
                            disabled
                        />
                    </SettingRow>
                </div>

                <Separator />

                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                        Password
                    </p>
                    <p className="text-xs text-muted-foreground">
                        You can change your password from the forgot password flow if you
                        signed up with email & password.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-full"
                        onClick={() => window.location.assign("/forgot-password")}
                    >
                        Change password
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------- APPEARANCE CARD ---------- */

function AppearanceCard({
    theme,
    setTheme,
}: {
    theme: Theme;
    setTheme: (v: Theme) => void;
}) {
    return (
        <Card className="border bg-background shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Palette className="h-4 w-4" />
                </div>
                <div>
                    <CardTitle className="text-sm font-semibold">
                        Appearance
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Choose how HireOrbit looks on your device.
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <RadioGroup
                    value={theme}
                    onValueChange={(v) =>
                        setTheme(v as Theme)
                    }
                    className="space-y-2"
                >
                    <ThemeOption
                        id="theme-system"
                        value="system"
                        label="System"
                        description="Follow your device’s light or dark mode automatically."
                    />
                    <ThemeOption
                        id="theme-light"
                        value="light"
                        label="Light"
                        description="Clean, bright interface best for well-lit environments."
                    />
                    <ThemeOption
                        id="theme-dark"
                        value="dark"
                        label="Dark"
                        description="Dimmed interface that’s easier on the eyes at night."
                    />
                </RadioGroup>

                <p className="mt-1 text-[11px] text-muted-foreground">
                    Later, you can sync this with your global theme toggle so the whole app
                    respects your account-level preference.
                </p>
            </CardContent>
        </Card>
    );
}

function ThemeOption({
    id,
    value,
    label,
    description,
}: {
    id: string;
    value: Theme;
    label: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2">
            <RadioGroupItem id={id} value={value} className="mt-1" />
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-xs font-medium">
                    {label}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );
}

/* ---------- DANGER ZONE CARD ---------- */

function DangerZoneCard() {
    const router = useRouter();

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );
        if (!confirmed) return;

        try {
            const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                toast.error("You must be logged in to delete your account.");
                router.replace("/login");
                return;
            }

            await axios.delete("/api/account", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Clean up local auth state
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(ROLE_KEY);

            toast.success("Your account has been deleted.");

            // Redirect to landing or login page
            router.replace("/");
        } catch (error: any) {
            console.error("[DangerZone] delete error:", error);
            const message =
                error?.response?.data?.message ||
                "Failed to delete account. Please try again.";
            toast.error(message);
        }
    };

    return (
        <Card className="border bg-background shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Danger zone
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                    Deleting your account will permanently remove your profile, saved jobs,
                    and application history from HireOrbit. This action cannot be undone.
                </p>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={handleDelete}
                >
                    Delete account
                </Button>
            </CardContent>
        </Card>
    );
}
/* ---------- GENERIC ROW COMPONENT ---------- */

function SettingRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
                <p className="text-xs font-medium">{label}</p>
                {description && (
                    <p className="text-[11px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="pt-1">{children}</div>
        </div>
    );
}
