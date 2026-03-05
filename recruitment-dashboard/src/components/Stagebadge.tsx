import { SelectionStage } from "@/types";

const stageColors: Record<SelectionStage, string> = {
  "応募": "bg-gray-100 text-gray-800",
  "書類選考": "bg-blue-100 text-blue-800",
  "一次面接": "bg-yellow-100 text-yellow-800",
  "二次面接": "bg-orange-100 text-orange-800",
  "最終面接": "bg-purple-100 text-purple-800",
  "内定": "bg-green-100 text-green-800",
  "入社": "bg-emerald-100 text-emerald-800",
  "不合格": "bg-red-100 text-red-800",
  "辞退": "bg-slate-100 text-slate-800",
};

export default function StageBadge({ stage }: { stage: SelectionStage }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors[stage]}`}>
      {stage}
    </span>
  );
}
