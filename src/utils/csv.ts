/**
 * 导出 CSV：添加 UTF-8 BOM 头，保证 Excel 直接打开中文不乱码。
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    // 含逗号/引号/换行时用引号包裹并转义内部引号
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(escape).join(','));
  // \uFEFF 为 UTF-8 BOM
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}