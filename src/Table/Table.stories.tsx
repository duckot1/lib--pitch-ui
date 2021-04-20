// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import { Table } from './Table';
import { EditableTable } from './Editable_Table'

import { editableTableHeaders, getEditableTableDummyData } from './dummy_data'

export default {
    title: "Table",
    component: Table
};

let standardTableData = [
    {tableId: '1', name: 'Tom', height: '6ft', age: 20},
    {tableId: '2', name: 'Tom', height: '6ft', age: 22},
    {tableId: '3', name: 'Tom', height: '6ft', age: 23},
    {tableId: '4', name: 'Tom', height: '6ft', age: 24},
    {tableId: '5', name: 'Tom', height: '6ft', age: 25}
]

let standardTableHeaders = [
    {key: 'name', name: 'Name', width: 33},
    {key: 'height', name: 'Height', width: 33},
    {key: 'age', name: 'Age', width: 33}
]

export const Standard = () => {
    const [selectedRow, setSelectedRow] = useState(null)

    return (
      <Table
        // Table props
        highlightRow={(tableId) => setSelectedRow(tableId)}
        highlightedRow={selectedRow}

        // controls
        controls={[
        ]}

        options={{initialOrder: 'asc', initialSortBy: 'id', sortActive: true}}
        headerFont={13}
        tableClass={'minimalistBlack'}
        className={'small-container'}
        smallHead={true}
        data={standardTableData}
        headers={standardTableHeaders}
        id={'table'}
      />
    );
}

Standard.storyName = 'I am the primary';

export const Editable = () => {
    const [selectedRow, setSelectedRow] = useState(null)

    const [tableData, setTableData] = useState(getEditableTableDummyData())

    const [tableHeaders, setTableHeaders] = useState(editableTableHeaders)

    useEffect(() => {
        setTableHeaders(editableTableHeaders.map(header => {
            if (header.input) header.input.onChange = (row, value) => {
                // Parse data (If input type is table modal use )
                console.log('do something here if you need custom functionality when changing cell data')
            }
            return header
        }))

        setTableData(getEditableTableDummyData())
    }, [])

    return (
      <EditableTable
        // Table props
        data={tableData}
        headers={tableHeaders}

        highlightRow={(tableId) => setSelectedRow(tableId)}
        highlightedRow={selectedRow}

        // controls
        controls={[

        ]}

        options={{initialOrder: 'asc', initialSortBy: 'id', sortActive: true}}
        headerFont={13}
        tableClass={'minimalistBlack'}
        className={'small-container'}

        id={'table'}

        saveChanges={({newRows, editedRows, deletedRows}) => {
            console.log(newRows, editedRows, deletedRows)
        }}
      />
    );
}

