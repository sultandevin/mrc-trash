import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SubmissionForm } from "@/features/submissions/submission-form";
import { submitResponse } from "@/features/submissions/submit";
import { MotionProvider } from "@/components/motion-provider";

export const Route = createFileRoute("/")({ component: HomeComponent });

function HomeComponent() {
  const save = useServerFn(submitResponse);
  return (
    <MotionProvider>
      <SubmissionForm save={save} />
    </MotionProvider>
  );
}
