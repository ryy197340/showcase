import {TableData as TableType} from '~/lib/sanity';

type Props = {
  content?: TableType;
};

const splitContent = (text: string) => {
  return text.split('\n').map((item, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <div key={`${item.substring(0, 10)}-${index}`}>{item}</div>
  ));
};

export default function Table({content}: Props) {
  if (!content) {
    return null; // Return null or handle the case when content is not available.
  }

  const {table_name, columns, rows} = content;

  return (
    <div className="page-width px-5">
      {table_name && <h2 className="pb-5">{table_name}</h2>}
      <table className="w-full border-collapse">
        <tbody>
          <tr className="bg-gray">
            {columns.map((column: string, columnIndex: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <th key={`column-${columnIndex}`} className="p-3 font-bold">
                {column}
              </th>
            ))}
          </tr>
          {rows.map((row: any, rowIndex: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={`row-${rowIndex}`}>
              {row.cells.map((cell: string, cellIndex: number) => (
                <td
                  className="p-[10px]"
                  // eslint-disable-next-line react/no-array-index-key
                  key={`row-${rowIndex}-cell-${cellIndex}`}
                >
                  {cellIndex === 0 ? splitContent(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
