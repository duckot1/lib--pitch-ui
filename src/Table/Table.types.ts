export interface TableProps {
    options?: TableOptions;
    /**
     * Checks if the button should be disabled
     */
    data: TableRow[];
    headers: TableHeader[];
    highlightRow?: HighlightRow;
    highlightedRow?: string;
    headerFont?: number;
    tableClass?: string;
    id?: string;
    controls?: TableControl[];
    className?: string;
    smallHead?: boolean;
    editCell?: EditCell;
    setEditCell?: SetEditCell;
    updateCellValue?: UpdateCellValue;
    updateEditedRows?: UpdateRowsObject;
    editedRows?: RowsObject;
    updateDeletedRows?: UpdateRowsObject;
    deletedRows?: RowsObject;
    newRows?: RowsObject;
    isEditableTable?: boolean;
}

export interface TableOptions {
    initialSortBy: string;
    initialOrder: string;
    sortActive?: boolean;
};

type TableControlCallback = (selectedRow: TableRow) => void

export interface TableControl {
    name: string;
    hidden?: boolean;
    callback: TableControlCallback;
}

export interface TableHeader {
    name: string;
    key: string;
    type?: string;
    defaultValue?: any;
    convert?: ConvertData;
    input?: TableInput;
    headerColor?: string;
    width?: number;
}

// Display function converts values to string to be displayed in the table cell
type DisplayFunction = (value: any) => string
// Parse function converts displayed strings back into their respective value types
type ParseFunction = (value: string) => any

interface ConvertData {
    display: DisplayFunction;
    parse: ParseFunction;
}

export interface TableRow {
    tableId: string;
    backgroundColor?: string;
    [key: string]: any;
}

export type HighlightRow = (tableId: string, item?: TableRow) => void

export type HighlightRowCallback = (item: TableRow) => void

/*========= Table input types ==========*/

// Optional callback fired on table input (button click handle or input update)
type TableInputCallback = (item: TableRow, value?: any) => any
type TableInputOnChange = (item: TableRow, value: any) => any

export interface TableInput {
    type: string;
    tableOptions?: string;
    selectOptions?: SelectOption[];
    onChange: TableInputOnChange;
    callback: TableInputCallback
}

// Option for select input
interface SelectOption {
    name: string;
    value: string | number;
}

/*======== Edit Table Types =========*/

// Details of cell currently being edited
export interface EditCell {
    headerKey: string;
    rowId: string;
    value: string;
}

export type UpdateCellValue = (value: string) => void

export type UpdateRowsObject = (item: TableRow, key?: any, value?: any) => any

export type SetEditCell = (rowId: string, headerKey: string, value: string) => void

export interface RowsObject {
    [tableId: string]: TableRow;
}