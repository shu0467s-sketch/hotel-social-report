from __future__ import annotations

import json
from pathlib import Path
import re

import pandas as pd


SOURCE = Path("/Users/shuzhan/Desktop/酒店夜间服务社媒调研清洗表_已填充.xlsx")
TARGET = Path("app/hotel-social-report/hotelSocialData.ts")

PROBLEM_RULES = {
    "客房安全": r"房门.{0,10}(开|敞开)|门.{0,5}忘关|房门大开|私开|房门.*敞开",
    "服务沟通": r"沟通|询问|电话|话术|态度|推诿|威胁|催促|道歉",
    "异常处置": r"换房|没房|赔偿|退款|投诉|维权|另订酒店",
    "夜间安静": r"噪音|隔音|太吵|吵醒|唱歌|下水道.{0,6}响|睡不着",
    "入住办理": r"办理.{0,4}入住|入住.{0,4}办理|登记|房卡|升级|预订|到店",
    "客房卫生": r"卫生|污渍|异物|没洗干净|床单|活虫|虫害|蟑螂|飞蚁|老鼠|异味|小虫|棉签",
    "响应时效": r"等待|等候|迟迟|慢吞吞|半个钟|半小时|催.{0,3}请|响应速度慢|排队",
}

AD_RULES = {
    "客房/床品": r"房间|客房|床品|大床|房型|装修|设施|枕|卫生",
    "餐饮/夜宵": r"早餐|夜宵|深夜粥|粥到|小吃|餐厅|吃",
    "位置/出行": r"地铁|高铁|火车站|交通|步行|出行|核心|位置|商圈|景点",
    "安静/睡眠": r"安静|隔音|睡眠|静谧",
    "会员/权益": r"会员|优惠|券|免费|延时",
    "洗衣服务": r"洗衣|洗烘|烘干",
    "机器人送物": r"机器人|送餐|送物",
}


def clean(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def main() -> None:
    table = pd.read_excel(SOURCE, sheet_name="原始数据")
    records: list[dict[str, object]] = []

    for source_row, row in table.iterrows():
        date_value = pd.to_datetime(row["发布日期"], errors="coerce")
        if pd.isna(date_value):
            continue

        text = " ".join(
            [clean(row["标题"]), clean(row["核心内容"]), clean(row["核心评论"])]
        )
        records.append(
            {
                "sourceRow": int(source_row) + 2,
                "date": date_value.strftime("%Y-%m-%d"),
                "night": clean(row["是否夜间"]) == "是",
                "platform": clean(row["平台"]),
                "ad": clean(row["是否广告（初筛）"]) == "是",
                "brand": clean(row["品牌"]),
                "scene": clean(row["场景"]),
                "sentiment": clean(row["情感"]),
                "problemTags": [
                    label for label, pattern in PROBLEM_RULES.items() if re.search(pattern, text)
                ],
                "adTags": [
                    label for label, pattern in AD_RULES.items() if re.search(pattern, text)
                ],
            }
        )

    target_parent = TARGET.parent
    target_parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(records, ensure_ascii=False, separators=(",", ":"))
    target = """export type HotelSocialRecord = {
  sourceRow: number;
  date: string;
  night: boolean;
  platform: string;
  ad: boolean;
  brand: string;
  scene: string;
  sentiment: string;
  problemTags: string[];
  adTags: string[];
};

export const hotelSocialRecords: HotelSocialRecord[] = """ + serialized + ";\n"
    TARGET.write_text(target, encoding="utf-8")


if __name__ == "__main__":
    main()
