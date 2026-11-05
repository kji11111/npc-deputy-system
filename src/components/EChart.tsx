import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface Props {
  option: EChartsOption;
  height?: number | string;
}

/** ECharts 轻封装：负责初始化、窗口缩放自适应与卸载销毁 */
export default function EChart({ option, height = 320 }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    if (!boxRef.current) return;
    const chart = echarts.init(boxRef.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={boxRef} style={{ width: '100%', height }} />;
}