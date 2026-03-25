import "../FeaturesDemo.css";

export function MarkerKeyDemo(): JSX.Element {
  return (
    <ul className="mkd-list">
      <li>
        <span className="mkd-marker-wrap"><span className="mkd-marker blue">1</span></span>
        Single element or text selection
      </li>
      <li>
        <span className="mkd-marker-wrap"><span className="mkd-marker green">1</span></span>
        Multi-select or area (always green)
      </li>
    </ul>
  );
}
