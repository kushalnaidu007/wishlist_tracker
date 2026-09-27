"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/profile/rating-input";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Thanks for the feedback!");
      setKey((k) => k + 1);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquarePlus className="size-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Share feedback</DialogTitle>
        </DialogHeader>
        <form key={key} action={handleSubmit} className="space-y-4">
          <RatingInput
            name="overallSatisfaction"
            label="Overall, how satisfied are you with the app?"
            required
          />
          <RatingInput
            name="affordabilityClarity"
            label="How clear is it what you can actually afford?"
            required
          />
          <div className="space-y-1.5">
            <Label htmlFor="mostUsedFeature">Which feature do you use the most?</Label>
            <Input id="mostUsedFeature" name="mostUsedFeature" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confusingOrBroken">
              Did anything feel confusing or not work as expected?
            </Label>
            <Input id="confusingOrBroken" name="confusingOrBroken" maxLength={1000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="additionalComments">Anything else you&apos;d like to share?</Label>
            <Textarea id="additionalComments" name="additionalComments" maxLength={2000} rows={3} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Sending…" : "Send feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
