import { validateAuth } from "@/services/api";
import { createFileRoute } from "@tanstack/react-router";

function WalkthroughPage() {
  return <div className="w-full h-screen"></div>;
}

export const Route = createFileRoute("/walkthrough")({
  beforeLoad: validateAuth,
  component: WalkthroughPage,
});
