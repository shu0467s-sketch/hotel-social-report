import type { Metadata } from "next";
import { ReportInsightPage } from "../ReportInsightPages";

export const metadata: Metadata = {
  title: "用户视角｜酒店服务社媒调研",
};

export default function UgcPage() {
  return <ReportInsightPage mode="ugc" />;
}
