import { CURRENCIES } from "@/lib/currencies";

export function CurrencyOptions() {
  return (
    <>
      {CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </>
  );
}
