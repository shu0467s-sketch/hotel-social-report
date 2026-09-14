import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { HotelSocialOverview } from "../app/hotel-social-report/HotelSocialOverview";
import { ReportInsightPage } from "../app/hotel-social-report/ReportInsightPages";
import "./site.css";

type View = "overview" | "ugc" | "advertiser";

function readView(): View {
  if (window.location.hash === "#ugc") return "ugc";
  if (window.location.hash === "#advertiser") return "advertiser";
  return "overview";
}

function PreviewApp() {
  const [view, setView] = useState<View>(readView);

  useEffect(() => {
    const update = () => setView(readView());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  if (view === "ugc") return <ReportInsightPage mode="ugc" />;
  if (view === "advertiser") return <ReportInsightPage mode="advertiser" />;
  return <HotelSocialOverview />;
}

createRoot(document.getElementById("root")!).render(<PreviewApp />);
