import { useState } from "react";

function CollapsibleSection({
  actions,
  children,
  className = "",
  defaultOpen = false,
  description,
  forceOpen = false,
  meta,
  title,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isSectionOpen = isOpen || forceOpen;
  const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className={`panel collapsible-section ${className}`}>
      <div className="collapsible-header">
        <button
          aria-controls={sectionId}
          aria-expanded={isSectionOpen}
          className="collapsible-toggle"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
        >
          <span className="collapsible-heading">
            <strong>{title}</strong>
            {description && <small>{description}</small>}
          </span>
          {meta && <span className="collapsible-meta">{meta}</span>}
          <span aria-hidden="true" className={`collapsible-chevron ${isSectionOpen ? "open" : ""}`} />
        </button>

        {actions && <div className="collapsible-actions">{actions}</div>}
      </div>

      {isSectionOpen && <div className="collapsible-content" id={sectionId}>{children}</div>}
    </section>
  );
}

export default CollapsibleSection;
