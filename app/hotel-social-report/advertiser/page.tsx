import type { Metadata } from "next";
import { ReportInsightPage } from "../ReportInsightPages";

export const metadata: Metadata = {
  title: "商家视角｜酒店服务社媒调研",
};

export default function AdvertiserPage() {
  return <ReportInsightPage mode="advertiser" />;
}
