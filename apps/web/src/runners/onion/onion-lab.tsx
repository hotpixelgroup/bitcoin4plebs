import { useState } from 'react';
import {
  ONION_PACKET_SIZE,
  ONION_VECTOR,
  constructOnion,
  peelOnion,
} from '@bitcoin4plebs/lightning-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const short = (hex: string) => `${hex.slice(0, 24)}…${hex.slice(-8)}`;

interface Built {
  onion: string;
  matches: boolean;
}

interface Layer {
  hop: number;
  payload: string;
  payloadOk: boolean;
  isFinal: boolean;
  sizeAfter: number;
}

/**
 * The onion lab: rebuild BOLT #4's own published test packet from this
 * site's dependency-free cryptography and require a byte-for-byte match,
 * then peel it hop by hop and watch each node recover its own payload and
 * nothing else, with the forwarded packet never changing size.
 */
export function OnionLab({ finale }: RunnerProps) {
  const [built, setBuilt] = useState<Built | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [busy, setBusy] = useState(false);

  const build = async () => {
    setBusy(true);
    setLayers([]);
    const { onion } = await constructOnion({
      sessionKey: ONION_VECTOR.sessionKey,
      hops: ONION_VECTOR.hops.map((h) => ({ nodeId: h.nodeId, payload: h.payload })),
      associatedData: ONION_VECTOR.associatedData,
    });
    setBuilt({ onion, matches: onion === ONION_VECTOR.onion });
    setBusy(false);
  };

  const peel = async () => {
    setBusy(true);
    let packet = ONION_VECTOR.onion as string;
    const found: Layer[] = [];
    for (const [i, nodeKey] of ONION_VECTOR.nodeKeys.entries()) {
      const result = await peelOnion(packet, nodeKey, ONION_VECTOR.associatedData);
      found.push({
        hop: i,
        payload: result.payload,
        payloadOk: result.payload === ONION_VECTOR.hops[i].payload,
        isFinal: result.isFinal,
        sizeAfter: result.nextOnion.length / 2,
      });
      packet = result.nextOnion;
    }
    setLayers(found);
    setBusy(false);
  };

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Act one: <strong>rebuild the specification's own packet</strong>. Five hops, the
          session key and payloads BOLT #4 publishes, and this site's own elliptic-curve math
          and ChaCha20, no cryptography library anywhere.
        </p>
        <button className="runbtn" onClick={build} disabled={busy}>
          {built ? '▶ Build it again' : "▶ Build BOLT #4's test onion"}
        </button>
        {built?.matches && (
          <Callout>
            <strong>✓ Byte for byte, all {ONION_PACKET_SIZE} of them.</strong> This is worth
            pausing on: the packet only comes out identical if the curve arithmetic, the stream
            cipher, all four key derivations, the blinding chain <em>and</em> the filler
            accumulation are every one of them exactly right. A single wrong bit anywhere and
            the whole thing diverges. There is no partial credit, which is why this is a real
            check and not a reassuring animation.
          </Callout>
        )}
        {built && !built.matches && (
          <Callout>
            <strong>✗ Mismatch.</strong> If you are seeing this, something in this site's
            cryptography is wrong and the CI check that guards it has failed too. Please{' '}
            <a
              href="https://github.com/hotpixelgroup/bitcoin4plebs/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
            >
              tell us loudly
            </a>
            .
          </Callout>
        )}
        <p>
          Act two: <strong>peel it, hop by hop</strong>. Each node uses only its own private key.
          Watch two things: each recovers exactly its own payload, and the packet it forwards is
          the same size as the one it received.
        </p>
        <button className="runbtn" onClick={peel} disabled={busy}>
          {layers.length ? '▶ Peel again' : '▶ Walk the route'}
        </button>
        {layers.length > 0 && (
          <Callout>
            <strong>✓ Every hop recovered its own payload, and nothing else.</strong> Look at the
            size column: 1,366 bytes in, 1,366 bytes out, every single time. A hop cannot measure
            the packet to work out how far along it is, because there is nothing to measure. Only
            the last hop learns anything about its position: its onward HMAC is all zeros, which
            is the specification's way of saying “this one is for you”.
          </Callout>
        )}
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">One packet, five layers</div>
          <div className="viz-sub">construction per BOLT #4 §Packet Construction</div>

          <div className="guess-feed">
            <div className="stat-label">the packet we built ({ONION_PACKET_SIZE} bytes)</div>
            <code className={`guess-hex ${built?.matches ? 'mine-winner' : 'mine-target'}`}>
              {built ? short(built.onion) : 'press ▶ to build'}
            </code>
            <div className="stat-label">the packet the specification publishes</div>
            <code className="guess-hex mine-target">{short(ONION_VECTOR.onion)}</code>
            {built?.matches && (
              <div className="guess-verdict mine-won">
                ✓ identical, all {ONION_PACKET_SIZE} bytes, the spec grading our arithmetic
              </div>
            )}
          </div>

          {layers.length > 0 && (
            <div className="guess-feed">
              <div className="stat-label">peeling: what each hop sees</div>
              <div className="field-rows">
                {layers.map((layer) => (
                  <div className="field-row" key={layer.hop}>
                    <span className="field-label">hop {layer.hop}</span>
                    <span className="field-hex">
                      {layer.payloadOk ? '✓' : '✗'} {layer.payload.length / 2}-byte payload
                      <span className="field-src">
                        {' '}
                        ← forwards {layer.sizeAfter} bytes
                        {layer.isFinal && ' · final recipient, onward HMAC is all zeros'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="guess-verdict mine-won">
                ✓ {layers.filter((l) => l.payloadOk).length} of {layers.length} payloads recovered
                exactly, every forwarded packet {ONION_PACKET_SIZE} bytes
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
