import Link from "next/link";

type Category = { id: string; name: string; type: string };

type Props = {
  period: string;
  search: string;
  category: string;
  type: string;
  categories: Category[];
  filtered: boolean;
  exportHref: string;
};

export function TransactionFilters({
  period,
  search,
  category,
  type,
  categories,
  filtered,
  exportHref,
}: Props) {
  return (
    <form method="get" action="/transactions" className="card card-pad">
      <input type="hidden" name="period" value={period} />

      <div className="toolbar">
        <div className="field toolbar-grow">
          <label htmlFor="filter-q" className="label">
            Search notes
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="e.g. taksi"
            maxLength={80}
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "0 1 10rem" }}>
          <label htmlFor="filter-category" className="label">
            Category
          </label>
          <select
            id="filter-category"
            name="category"
            defaultValue={category}
            className="select"
          >
            <option value="">All categories</option>
            <option value="none">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="filter-type" className="label">
            Type
          </label>
          <select
            id="filter-type"
            name="type"
            defaultValue={type}
            className="select"
          >
            <option value="">Both</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <button type="submit" className="btn btn-secondary">
          Apply
        </button>

        {filtered && (
          <Link
            href={`/transactions?period=${period}`}
            className="btn btn-ghost"
          >
            Clear
          </Link>
        )}

        <a href={exportHref} className="btn btn-ghost" download>
          Export CSV
        </a>

        <Link href="/transactions/import" className="btn btn-ghost">
          Import CSV
        </Link>
      </div>
    </form>
  );
}
