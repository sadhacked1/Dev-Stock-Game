import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StockHistoryPoint, TradeRecord } from '../types/game';

interface StockChartProps {
  history: StockHistoryPoint[];
  trades?: TradeRecord[];
  ticker: string;
  height?: number;
}

export const StockChart: React.FC<StockChartProps> = ({
  history,
  trades = [],
  ticker,
  height = 340,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [rangeView, setRangeView] = useState<'30' | '60' | 'all'>('30');

  // Filter history based on range view
  const visibleData = useMemo(() => {
    if (rangeView === '30') return history.slice(-30);
    if (rangeView === '60') return history.slice(-60);
    return history;
  }, [history, rangeView]);

  // Calculate 20-period Simple Moving Average
  const sma20 = useMemo(() => {
    return visibleData.map((_, idx, arr) => {
      if (idx < 19) return null;
      let sum = 0;
      for (let j = idx - 19; j <= idx; j++) {
        sum += arr[j].close;
      }
      return sum / 20;
    });
  }, [visibleData]);

  // Match trades on visible days
  const tradeMap = useMemo(() => {
    const map = new Map<number, TradeRecord[]>();
    trades.forEach((t) => {
      if (t.ticker === ticker) {
        const list = map.get(t.day) || [];
        list.push(t);
        map.set(t.day, list);
      }
    });
    return map;
  }, [trades, ticker]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visibleData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 65, bottom: 45, left: 15 };
    const chartWidth = width - padding.left - padding.right;
    const mainChartHeight = (height - padding.top - padding.bottom) * 0.72;
    const volChartTop = padding.top + mainChartHeight + 12;
    const volChartHeight = (height - padding.top - padding.bottom) * 0.24;

    // Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleData.forEach((d) => {
      if (d.low < minPrice) minPrice = d.low;
      if (d.high > maxPrice) maxPrice = d.high;
      if (d.volume > maxVolume) maxVolume = d.volume;
    });

    if (minPrice === maxPrice) {
      minPrice *= 0.95;
      maxPrice *= 1.05;
    }

    const priceBuffer = (maxPrice - minPrice) * 0.08;
    minPrice = Math.max(0.1, minPrice - priceBuffer);
    maxPrice = maxPrice + priceBuffer;
    const priceRange = maxPrice - minPrice;

    const n = visibleData.length;
    const barWidth = Math.max(3, (chartWidth / n) * 0.65);
    const step = chartWidth / (n - 1 || 1);

    const getY = (val: number) => padding.top + mainChartHeight - ((val - minPrice) / priceRange) * mainChartHeight;
    const getVolY = (vol: number) => volChartTop + volChartHeight - (vol / (maxVolume || 1)) * volChartHeight;

    // Background horizontal grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const gridSteps = 4;
    ctx.fillStyle = '#71717a';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridSteps; i++) {
      const priceVal = minPrice + (priceRange / gridSteps) * i;
      const y = getY(priceVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`$${priceVal.toFixed(1)}`, width - padding.right + 6, y + 3);
    }

    ctx.setLineDash([]);

    // Draw Volume Bars
    visibleData.forEach((d, idx) => {
      const x = padding.left + idx * step;
      const isUp = d.close >= d.open;
      const vY = getVolY(d.volume);
      const vHeight = volChartTop + volChartHeight - vY;

      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
      ctx.fillRect(x - barWidth / 2, vY, barWidth, vHeight);
    });

    // Draw Main Chart (Line or Candle)
    if (chartType === 'line') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      visibleData.forEach((d, idx) => {
        const x = padding.left + idx * step;
        const y = getY(d.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Subtle gradient fill under the line
      const firstX = padding.left;
      const lastX = padding.left + (n - 1) * step;
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + mainChartHeight);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = grad;
      ctx.lineTo(lastX, padding.top + mainChartHeight);
      ctx.lineTo(firstX, padding.top + mainChartHeight);
      ctx.closePath();
      ctx.fill();
    } else {
      // Candlesticks
      visibleData.forEach((d, idx) => {
        const x = padding.left + idx * step;
        const isUp = d.close >= d.open;
        const candleColor = isUp ? '#22c55e' : '#ef4444';

        // Draw wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, getY(d.high));
        ctx.lineTo(x, getY(d.low));
        ctx.stroke();

        // Draw body
        const top = getY(Math.max(d.open, d.close));
        const bottom = getY(Math.min(d.open, d.close));
        const bodyHeight = Math.max(2, bottom - top);

        ctx.fillStyle = candleColor;
        ctx.fillRect(x - barWidth / 2, top, barWidth, bodyHeight);
      });
    }

    // Draw SMA 20 Overlay
    if (showSMA) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;

      sma20.forEach((val, idx) => {
        if (val === null) return;
        const x = padding.left + idx * step;
        const y = getY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw Trade Markers (Buy / Sell tags)
    visibleData.forEach((d, idx) => {
      const dayTrades = tradeMap.get(d.day);
      if (!dayTrades || dayTrades.length === 0) return;

      const x = padding.left + idx * step;
      dayTrades.forEach((t) => {
        const isBuy = t.side === 'BUY';
        const y = isBuy ? getY(d.low) + 16 : getY(d.high) - 16;

        ctx.fillStyle = isBuy ? '#22c55e' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isBuy ? 'B' : 'S', x, y + 3);
      });
    });

    // Draw Crosshair and Tooltip if hovered
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n) {
      const d = visibleData[hoverIndex];
      const hX = padding.left + hoverIndex * step;

      // Vertical line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hX, padding.top);
      ctx.lineTo(hX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Day label at bottom
      ctx.fillStyle = '#27272a';
      ctx.fillRect(hX - 25, height - padding.bottom + 6, 50, 18);
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Day ${d.day}`, hX, height - padding.bottom + 19);
    }
  }, [visibleData, chartType, showSMA, rangeView, height, hoverIndex, sma20, tradeMap]);

  // Handle canvas mouse move for interactive tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || visibleData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 15;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const n = visibleData.length;
    const step = chartWidth / (n - 1 || 1);

    const index = Math.round((x - paddingLeft) / step);
    if (index >= 0 && index < n) {
      setHoverIndex(index);
      setHoverPos({ x, y });
    } else {
      setHoverIndex(null);
      setHoverPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  const activePoint = hoverIndex !== null && visibleData[hoverIndex] ? visibleData[hoverIndex] : visibleData[visibleData.length - 1];

  return (
    <div className="flex flex-col w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 select-none">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-850 text-xs">
        {/* Metric Inspector Badge */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-400">
            Day {activePoint?.day ?? 0}
          </span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-zinc-400">O: <strong className="text-zinc-200">${activePoint?.open?.toFixed(2)}</strong></span>
            <span className="text-zinc-400">H: <strong className="text-emerald-400">${activePoint?.high?.toFixed(2)}</strong></span>
            <span className="text-zinc-400">L: <strong className="text-rose-400">${activePoint?.low?.toFixed(2)}</strong></span>
            <span className="text-zinc-400">C: <strong className={activePoint && activePoint.close >= activePoint.open ? 'text-emerald-400' : 'text-rose-400'}>${activePoint?.close?.toFixed(2)}</strong></span>
          </div>
          <span className="text-zinc-500 font-mono hidden md:inline">
            Vol: {activePoint?.volume ? (activePoint.volume / 1000).toFixed(0) + 'k' : '0'}
          </span>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center gap-2">
          {/* Range selection */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setRangeView('30')}
              className={`px-2 py-0.5 rounded transition ${rangeView === '30' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              30D
            </button>
            <button
              onClick={() => setRangeView('60')}
              className={`px-2 py-0.5 rounded transition ${rangeView === '60' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              60D
            </button>
            <button
              onClick={() => setRangeView('all')}
              className={`px-2 py-0.5 rounded transition ${rangeView === 'all' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              All
            </button>
          </div>

          {/* Candle vs Line Toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-0.5 rounded transition ${chartType === 'candle' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-0.5 rounded transition ${chartType === 'line' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Line
            </button>
          </div>

          {/* SMA 20 Checkbox */}
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] transition ${
              showSMA
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            SMA 20
          </button>
        </div>
      </div>

      {/* Main Canvas Chart */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair w-full block"
        />

        {/* Hover Tooltip Box */}
        {hoverPos && activePoint && (
          <div
            className="pointer-events-none absolute z-20 bg-zinc-900/95 border border-zinc-700 text-zinc-200 p-2 rounded shadow-xl text-xs backdrop-blur font-mono"
            style={{
              left: Math.min(hoverPos.x + 12, (containerRef.current?.clientWidth || 300) - 170),
              top: Math.max(10, hoverPos.y - 70),
            }}
          >
            <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1 mb-1">
              Day {activePoint.day} Price Data
            </div>
            <div>Open: <span className="text-white">${activePoint.open.toFixed(2)}</span></div>
            <div>High: <span className="text-emerald-400">${activePoint.high.toFixed(2)}</span></div>
            <div>Low: <span className="text-rose-400">${activePoint.low.toFixed(2)}</span></div>
            <div>Close: <span className="text-sky-300 font-bold">${activePoint.close.toFixed(2)}</span></div>
            <div>Vol: <span className="text-zinc-400">{activePoint.volume.toLocaleString()}</span></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Buy Marker
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Sell Marker
          </span>
        </div>
        <span>Volume Bars & Intraday Wicks shown</span>
      </div>
    </div>
  );
};
