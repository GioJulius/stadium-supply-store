import {
  EMPTY_RAIL,
  KIT_SLOT_LABELS,
  railIsActive,
  VERSION_LABELS,
  type KitSlot,
  type RailState,
  type ShopFacets,
} from "@/lib/facets";
import { X } from "lucide-react";

/**
 * The shop's filter rail.
 *
 * On desktop it sits beside the grid; below 1000px it becomes a sheet the
 * "Filters" button opens, because a permanent rail on a phone costs more
 * screen than the grid it is meant to serve.
 *
 * Season and kit slot each carry a "Not specified" option. Roughly half the
 * catalogue never declares either, and without that option those listings
 * would vanish the moment a shopper touched the filter with no way to tell
 * that they had been dropped.
 */
export function FilterRail({
  facets,
  rail,
  onChange,
  open,
  onClose,
  resultCount,
}: {
  facets: ShopFacets;
  rail: RailState;
  onChange: (next: RailState) => void;
  open: boolean;
  onClose: () => void;
  resultCount: number;
}) {
  const active = railIsActive(rail);

  function toggleSize(size: string) {
    onChange({
      ...rail,
      sizes: rail.sizes.includes(size) ? rail.sizes.filter(s => s !== size) : [...rail.sizes, size],
    });
  }

  const hasPriceSpread = facets.priceMax > facets.priceMin;

  return (
    <>
      <button
        type="button"
        className={`rail-scrim ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-label="Close filters"
        tabIndex={open ? 0 : -1}
      />
      <aside className={`filter-rail ${open ? "is-open" : ""}`} aria-label="Filter kits">
        <div className="filter-rail__head">
          <p className="eyebrow">Narrow it down</p>
          <button type="button" className="icon-button filter-rail__close" onClick={onClose} aria-label="Close filters"><X size={19} /></button>
        </div>

        {facets.versions.length > 1 ? (
          <fieldset className="filter-group">
            <legend>Version</legend>
            <div className="filter-group__row filter-group__row--split">
              {facets.versions.map(version => (
                <button
                  key={version}
                  type="button"
                  className={rail.version === version ? "chip is-on" : "chip"}
                  aria-pressed={rail.version === version}
                  onClick={() => onChange({ ...rail, version: rail.version === version ? null : version })}
                >{VERSION_LABELS[version]}</button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {facets.sizes.length ? (
          <fieldset className="filter-group">
            <legend>Size <span>— in stock only</span></legend>
            <div className="filter-group__row">
              {facets.sizes.map(size => (
                <button
                  key={size}
                  type="button"
                  className={rail.sizes.includes(size) ? "chip is-on" : "chip"}
                  aria-pressed={rail.sizes.includes(size)}
                  onClick={() => toggleSize(size)}
                >{size}</button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {facets.seasons.length ? (
          <fieldset className="filter-group">
            <legend>Season</legend>
            <select
              value={rail.season ?? ""}
              onChange={event => onChange({ ...rail, season: (event.target.value || null) as RailState["season"] })}
              aria-label="Season"
            >
              <option value="">Any season</option>
              {facets.seasons.map(season => <option key={season} value={season}>{season}</option>)}
              <option value="unspecified">Not specified</option>
            </select>
          </fieldset>
        ) : null}

        {facets.slots.length ? (
          <fieldset className="filter-group">
            <legend>Home / away / third</legend>
            <select
              value={rail.slot ?? ""}
              onChange={event => onChange({ ...rail, slot: (event.target.value || null) as RailState["slot"] })}
              aria-label="Home, away or third"
            >
              <option value="">Any</option>
              {facets.slots.map(slot => <option key={slot} value={slot}>{KIT_SLOT_LABELS[slot as KitSlot]}</option>)}
              <option value="unspecified">Not specified</option>
            </select>
          </fieldset>
        ) : null}

        {hasPriceSpread ? (
          <fieldset className="filter-group">
            <legend>Price <span>— up to R{rail.maxPrice ?? facets.priceMax}</span></legend>
            <input
              type="range"
              min={facets.priceMin}
              max={facets.priceMax}
              step={50}
              value={rail.maxPrice ?? facets.priceMax}
              onChange={event => {
                const value = Number(event.target.value);
                onChange({ ...rail, maxPrice: value >= facets.priceMax ? null : value });
              }}
              aria-label={`Maximum price, up to R${facets.priceMax}`}
            />
            <p className="filter-group__scale"><span>R{facets.priceMin}</span><span>R{facets.priceMax}</span></p>
          </fieldset>
        ) : null}

        <div className="filter-rail__foot">
          {active ? <button type="button" className="text-link" onClick={() => onChange(EMPTY_RAIL)}>Clear all</button> : null}
          <button type="button" className="filter-rail__apply" onClick={onClose}>
            Show {resultCount} {resultCount === 1 ? "kit" : "kits"}
          </button>
        </div>
      </aside>
    </>
  );
}
