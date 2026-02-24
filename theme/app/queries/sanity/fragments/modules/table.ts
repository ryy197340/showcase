import groq from 'groq';

export const MODULE_TABLE_DATA = groq`
  _type == 'module.tableData' => {
    _key,
    table_name,
    columns,
    'rows': rows[]{
      cells
    }
  }
`;
