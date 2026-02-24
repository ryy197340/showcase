type Props = {
  filters: Record<string, string[]>;
  clearFilters: () => void;
};

export default function ClearButton({filters, clearFilters}: Props) {
  return (
    <button
      className=" mb-2 mt-2 underline opacity-60 hover:no-underline hover:opacity-80"
      style={{
        display: Object.keys(filters).length ? 'block' : 'none',
      }}
      onClick={clearFilters}
    >
      Clear All
    </button>
  );
}
