import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, ArrowRightCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview_scheduled"
  | "offered"
  | "rejected"
  | "hired";

const AUTH_TOKEN_KEY = "hireorbit_token";

/** Keep a single source of truth for stage options */
const STAGE_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "offered", label: "Offered" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

function statusLabel(status: ApplicationStatus) {
  return STAGE_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function MoveStageDialog({
  applicationId,
  currentStatus,
  currentStep,
  currentNextInterviewAt,
  onUpdated,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  currentStep: string;
  currentNextInterviewAt?: string | null;

  /**
   * Parent provides this so we can update UI state after success
   */
  onUpdated: (patch: {
    status: ApplicationStatus;
    step?: string;
    nextInterviewAt?: string | null;
  }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [status, setStatus] = React.useState<ApplicationStatus>(currentStatus);
  const [step, setStep] = React.useState<string>(currentStep || "");
  const [nextInterviewAt, setNextInterviewAt] = React.useState<string>(
    currentNextInterviewAt
      ? new Date(currentNextInterviewAt).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
      : ""
  );

  React.useEffect(() => {
    // Keep dialog in sync if card rerenders with new values
    setStatus(currentStatus);
    setStep(currentStep || "");
    setNextInterviewAt(
      currentNextInterviewAt
        ? new Date(currentNextInterviewAt).toISOString().slice(0, 16)
        : ""
    );
  }, [currentStatus, currentStep, currentNextInterviewAt, open]);

  const requiresInterviewDate = status === "interview_scheduled";

  async function handleSave() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;

    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }

    if (requiresInterviewDate && !nextInterviewAt) {
      toast.error("Please select an interview date/time.");
      return;
    }

    setSaving(true);
    try {
      // IMPORTANT: align to your backend route
      // If your backend uses: /api/employer/applications/[id]/status
      // then call it exactly like this:
      const payload = {
        status,
        step: step?.trim() || undefined,
        nextInterviewAt: nextInterviewAt ? new Date(nextInterviewAt).toISOString() : null,
      };

      await axios.patch(
        `/api/employer/applications/${applicationId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update parent list UI
      onUpdated({
        status,
        step: payload.step,
        nextInterviewAt: payload.nextInterviewAt,
      });

      toast.success("Stage updated.");
      setOpen(false);
    } catch (err) {
      console.error("[MoveStage] failed:", err);
      toast.error("Failed to update stage. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="rounded-full">
          <ArrowRightCircle className="mr-2 h-4 w-4" />
          Move stage
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Move candidate to next stage</DialogTitle>
          <DialogDescription>
            Update the candidate’s pipeline stage. This will reflect in their dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Current:</span>
            <Badge variant="secondary" className="rounded-full">
              {statusLabel(currentStatus)}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>New stage</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresInterviewDate && (
            <div className="space-y-2">
              <Label>Interview date & time</Label>
              <Input
                type="datetime-local"
                value={nextInterviewAt}
                onChange={(e) => setNextInterviewAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for “Interview scheduled”.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Step / note (optional)</Label>
            <Textarea
              value={step}
              onChange={(e) => setStep(e.target.value)}
              placeholder='E.g., "Screening call scheduled with HR"'
              className="min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Update stage"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
