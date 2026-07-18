import { useEffect, useRef, useState } from 'react';
import { VizFigure } from './viz-figure';

const EPOCH = 12; // compressed stand-in for Bitcoin's 2,016
const TARGET_MINUTES = 10;
const WINDOW = 36;

interface Tick {
  minutes: number;
  retargetAfter: boolean;
}

/**
 * The thermostat: blocks arrive at random (a real exponential clock whose
 * speed is hashrate ÷ difficulty). Yank the hashrate and watch intervals
 * drift off the 10-minute line, then watch the retarget measure reality
 * and snap them back. Nobody steers; the rule steers.
 */
export function DifficultyThermostat() {
  const [hashrate, setHashrate] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [running, setRunning] = useState(false);
  const sinceRetarget = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTicks((prev) => {
        // A real exponential draw: mean interval = 10 min × difficulty ÷ hashrate.
        const mean = (TARGET_MINUTES * difficulty) / hashrate;
        const minutes = -mean * Math.log(1 - Math.random());
        sinceRetarget.current.push(minutes);
        let retargetAfter = false;
        if (sinceRetarget.current.length >= EPOCH) {
          const actual = sinceRetarget.current.reduce((a, b) => a + b, 0);
          const expected = EPOCH * TARGET_MINUTES;
          // pow.cpp's clamp: the measured timespan counts, but never more
          // than 4× off in either direction.
          const clamped = Math.min(Math.max(actual, expected / 4), expected * 4);
          setDifficulty((d) => d * (expected / clamped));
          sinceRetarget.current = [];
          retargetAfter = true;
        }
        return [...prev, { minutes, retargetAfter }].slice(-WINDOW);
      });
    }, 380);
    return () => clearInterval(timer);
  }, [running, hashrate, difficulty]);

  const reset = () => {
    setRunning(false);
    setTicks([]);
    setDifficulty(1);
    setHashrate(1);
    sinceRetarget.current = [];
  };

  const recent = ticks.slice(-EPOCH);
  const avg = recent.length
    ? recent.reduce((a, t) => a + t.minutes, 0) / recent.length
    : TARGET_MINUTES;
  const maxBar = Math.max(25, ...ticks.map((t) => t.minutes));

  return (
    <VizFigure
      title="The thermostat"
      caption="Each bar is one block's arrival time. Change the world's hashrate; watch the rule (not a person) respond."
    >
      <div className="thermo-controls">
        <label className="height-input-label race-slider-label">
          World hashrate: <strong>{hashrate.toFixed(2)}×</strong>
          <input
            className="fee-slider"
            type="range"
            min={0.25}
            max={4}
            step={0.05}
            value={hashrate}
            onChange={(e) => setHashrate(Number(e.target.value))}
          />
        </label>
        <div className="preset-row">
          <button className="preset" onClick={() => setHashrate(Math.min(4, hashrate * 2))}>
            miners flood in (2×)
          </button>
          <button className="preset" onClick={() => setHashrate(Math.max(0.25, hashrate / 2))}>
            2021 China ban: half the hashrate exits
          </button>
          <button className="runbtn thermo-btn" onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ pause' : ticks.length ? '▶ resume' : '▶ start the clock'}
          </button>
          {ticks.length > 0 && (
            <button className="preset" onClick={reset}>
              reset
            </button>
          )}
        </div>
      </div>
      <div className="thermo-chart" aria-hidden="true">
        {ticks.map((tick, i) => (
          <div className="thermo-slot" key={i}>
            <div
              className={`thermo-bar ${tick.minutes > TARGET_MINUTES * 1.5 ? 'thermo-slow' : tick.minutes < TARGET_MINUTES / 1.5 ? 'thermo-fast' : ''}`}
              style={{ height: `${Math.min(100, (tick.minutes / maxBar) * 100)}%` }}
            />
            {tick.retargetAfter && <div className="thermo-retarget" title="retarget" />}
          </div>
        ))}
        <div className="thermo-target" style={{ bottom: `${(TARGET_MINUTES / maxBar) * 100}%` }}>
          <span>10 min target</span>
        </div>
      </div>
      <div className="stat-grid thermo-stats">
        <div className="stat">
          <div className="stat-label">difficulty (vs start)</div>
          <div className="stat-value">{difficulty.toFixed(2)}×</div>
        </div>
        <div className="stat">
          <div className="stat-label">recent average interval</div>
          <div className="stat-value">
            {avg.toFixed(1)} <span className="stat-unit">min</span>
          </div>
        </div>
      </div>
      <p className="viz-readout">
        {ticks.length === 0
          ? `Every ${EPOCH} blocks (standing in for Bitcoin's 2,016) the network measures how long they actually took against the ten-minute ideal, and corrects, clamped to 4× per step, exactly like pow.cpp. Start the clock, then sabotage it with the buttons.`
          : `Fast orange bars mean too much hashrate for the current difficulty; tall pale bars mean too little. The dotted marks are retargets: reality measured, difficulty ${difficulty > 1 ? 'raised' : difficulty < 1 ? 'lowered' : 'held'}, average dragged back toward 10. No operator exists: you just watched blind arithmetic absorb whatever you threw at it.`}
      </p>
    </VizFigure>
  );
}
