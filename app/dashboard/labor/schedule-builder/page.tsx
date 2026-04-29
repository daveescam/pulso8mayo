import { redirect } from "next/navigation";

/**
 * Schedule Builder Page - Redirects to Shifts Page
 * The schedule-builder functionality has been consolidated into the main shifts page.
 */
export default function ScheduleBuilderPage() {
  redirect("/dashboard/labor/shifts");
}
