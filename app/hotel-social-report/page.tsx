import type { Metadata } from "next";
import { HotelSocialOverview } from "./HotelSocialOverview";

export const metadata: Metadata = {
  title: "酒店夜间服务社媒调研",
  description: "基于已清洗社媒数据的酒店夜间服务市场调研总览。",
};

export default function HotelSocialReportPage() {
  return <HotelSocialOverview />;
}
