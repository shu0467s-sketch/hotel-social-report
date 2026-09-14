import type { Metadata } from "next";
import { RoboClawConfigurator } from "./RoboClawConfigurator";

export const metadata: Metadata = {
  title: "RoboClaw 机器人服务配置后台",
  description: "面向酒店、商场和展厅运营人员的机器人服务配置 Demo。",
};

export default function Home() {
  return <RoboClawConfigurator />;
}
