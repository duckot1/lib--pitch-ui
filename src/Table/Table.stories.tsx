// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import { Table } from './Table';
import EditableTable from './Editable_Table'
import Modal from '../Modal/Modal'
import Provider from '../Provider.js'
import configureStore from '../configureStore.js'

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

    const store = configureStore()
    const [selectedRow, setSelectedRow] = useState(null)

    const [tableData, setTableData] = useState(getEditableTableDummyData())
    const [updateTableAction, setUpdateTableAction] = useState(null)

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

    // Dummy reducer
    useEffect(() => {
        if (updateTableAction) {
            let type = updateTableAction.type
            let row = updateTableAction.payload
            let newState
            switch(type) {
                case 'CREATE':
                    const id = Math.floor(100000000 + Math.random() * 900000000)
                    newState = [...tableData, {...updateTableAction.payload, id}]
                    break
                case 'UPDATE':
                    newState = tableData.map((item) => {
                        if (item.id !== row.id) {
                            return item
                        }

                        return {
                            ...item,
                            ...row
                        }
                    })
                    break
                case 'DELETE':
                    newState = tableData.filter(item => {
                        return item.id !== row.id
                    })
                    break
                default:
            }
            setTableData(newState)

        }
    }, [updateTableAction])

    // Dummy request
    const axiosRequest = (onSuccess, success) => {
        return new Promise(function(resolve, reject) {
            setTimeout(() => {
                if (success) {
                    resolve("Status 200")
                    onSuccess()
                } else {
                    reject("Request Failed")
                }
            }, 2000)
        })
    }

    // Returning a promise here will make the table wait until it successfully resolves before updating
    const createRow = (row) => {
        return axiosRequest(() => setUpdateTableAction({payload: {...row}, type: 'CREATE'}), true)
    }

    // Returning a promise here will make the table wait until it successfully resolves before it updates
    const deleteRow = (row) => {
        return axiosRequest(() => setUpdateTableAction({payload: {...row}, type: 'DELETE'}), true)
    }

    // Returning a promise here will make the table wait until it successfully resolves before updating
    const updateRow = (row) => {
        return axiosRequest(() => setUpdateTableAction({payload: {...row}, type: 'UPDATE'}), false)
    }

    return (
      <Provider store={store}>
          <Modal />
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

            createRow={createRow}
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
      </Provider>
    );
}

