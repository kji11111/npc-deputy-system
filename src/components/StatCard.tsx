/** 统计卡片：仿参考模板 .cut 指标块（薄荷底 + 大数字 + 小标签），样式见 index.css */
export default function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="stat-cut">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <span>{sub}</span> : null}
    </div>
  );
}