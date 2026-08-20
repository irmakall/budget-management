"use client";

import { COLORS, ICONS } from "./constants";

type Props = {
  idPrefix: string;
  defaultName?: string;
  defaultIcon?: string | null;
  defaultColor?: string | null;
};

export function CategoryFields({
  idPrefix,
  defaultName = "",
  defaultIcon = null,
  defaultColor = null,
}: Props) {
  return (
    <>
      <div className="field" style={{ flex: "1 1 10rem" }}>
        <label htmlFor={`${idPrefix}-name`} className="label">
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          maxLength={40}
          defaultValue={defaultName}
          required
          className="input"
        />
      </div>

      <div className="field" style={{ flex: "0 1 5.5rem" }}>
        <label htmlFor={`${idPrefix}-icon`} className="label">
          Icon
        </label>
        <select
          id={`${idPrefix}-icon`}
          name="icon"
          defaultValue={defaultIcon ?? ""}
          className="select"
        >
          <option value="">—</option>
          {ICONS.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="field" style={{ flex: "0 1 auto" }}>
        <legend className="label">Color</legend>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {COLORS.map((color) => (
            <label key={color} className="cursor-pointer leading-none">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={defaultColor === color}
                className="swatch-input sr-only"
              />
              <span
                aria-hidden
                className="swatch"
                style={{ backgroundColor: color }}
              />
              <span className="sr-only">{color}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
