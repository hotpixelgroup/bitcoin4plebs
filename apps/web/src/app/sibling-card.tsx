import { SITE } from '../lib/site';

/**
 * The signpost to the other front door.
 *
 * bitcoin4plebs and lightning4plebs are one project wearing two names, and
 * a reader who lands on the wrong one should never have to work that out
 * for themselves. This says which layer they are standing on, what the
 * other one covers, and how to get there.
 */
export function SiblingCard() {
  const { sibling } = SITE;
  return (
    <section className="sibling" aria-labelledby="sibling-heading">
      <div className="sibling-body">
        <div className="sibling-eyebrow">{sibling.label}</div>
        <h2 id="sibling-heading" className="sibling-title">
          {sibling.name}
        </h2>
        <p className="sibling-blurb">{sibling.blurb}</p>
        <ul className="sibling-covers">
          {sibling.covers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a className="sibling-cta" href={sibling.url}>
          Go to {sibling.name} ↗
        </a>
        <p className="sibling-note">
          Same project, same rules, same people. Two front doors because they are two
          different layers.
        </p>
      </div>
    </section>
  );
}
