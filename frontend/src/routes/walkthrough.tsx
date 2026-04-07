import { getAuthStatus } from "@/services/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

function WalkthroughPage() {
  return <div className="w-full h-screen"></div>;
}

export const Route = createFileRoute("/walkthrough")({
  beforeLoad: async () => {
    try {
      const response = await getAuthStatus();
      if (!response.data.authenticated) {
        throw redirect({ to: "/" });
      }
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: WalkthroughPage,
});
