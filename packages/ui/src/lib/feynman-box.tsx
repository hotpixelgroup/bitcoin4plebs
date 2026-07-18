import { useState } from 'react';
import type { Feynman } from '@bitcoin4plebs/quests';
import { RichText } from './rich-text.js';

/**
 * Explain it back (the Feynman technique): the reader writes their own
 * explanation, then reveals a model answer to compare against. Nothing is
 * graded and nothing leaves the page; generating an explanation is the
 * exercise, and the comparison is the teacher.
 */
export function FeynmanBox({ feynman }: { feynman: Feynman }) {
  const [text, setText] = useState('');
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="feynman">
      <div className="feynman-head">
        <span className="viz-figure-badge">say it back</span>
        <span className="feynman-prompt">{feynman.prompt}</span>
      </div>
      <textarea
        className="feynman-input"
        rows={3}
        placeholder="Write it in your own words. Out loud counts too."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="feynman-actions">
        <button className="preset" onClick={() => setRevealed((r) => !r)}>
          {revealed ? 'hide the model answer' : 'compare with a model answer'}
        </button>
        <span className="verify-note feynman-note">Nothing is stored or graded. Explaining is the exercise.</span>
      </div>
      {revealed && (
        <p className="feynman-model">
          <RichText text={feynman.model} />
        </p>
      )}
    </div>
  );
}
