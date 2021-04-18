import React, { Component } from 'react'

import { Table } from './Table'

import { TableProps, EditCell, UpdateCellValue, SetEditCell, Rows, TableRow, UpdateRowsObject } from "./Table.types";

import _ from 'lodash'

interface TableState {
  editCell: EditCell;
  editedRows: Rows;
  newRows: TableRow[];
  deletedRows: Rows;
}

type SaveChanges = (newRows: TableRow[], editedRows: Rows, deletedRows: Rows) => void

interface EditableTableProps {
  saveChanges: SaveChanges;
}

export class EditableTable extends Component<TableProps & EditableTableProps, TableState> {
  state: TableState = {
    editCell: {
      headerKey: null,
      rowId: null,
      value: null
    },
    editedRows: {},
    newRows: [],
    deletedRows: {}
  };

  setEditCell: SetEditCell = (rowId, headerKey, value) => {
    this.setState({
      editCell: {
        headerKey,
        rowId,
        value
      }
    })
  }

  updateCellValue: UpdateCellValue = (value) => {
    const { editCell } = this.state
    this.setState({
      editCell: {
        ...editCell,
        value
      },
    })
  }

  updateEditedRows: UpdateRowsObject = (item, key, value) => {
    const { editedRows } = this.state
    if (item[key] === value) return
    this.setState({
      editedRows: {
        ...editedRows,
        [item.tableId]: {
          ...item,
          highlightColor: 'rgba(0, 180, 0, 0.5)',
          [key]: value
        }
      }
    })
  }

  addRow = () => {
    // Create new empty row from headers
    const { newRows } = this.state
    const { headers, id } = this.props

    let newRow = {
      tableId: `${newRows.length}-${id}-new`,
      highlightColor: 'rgba(0, 180, 0, 0.5)',
    }

    headers.forEach(header => {
      newRow[header.key] = header.defaultValue || null
    })

    this.setState({
      newRows: [
        ...newRows,
        newRow
      ]
    })
  }

  updateDeletedRows: UpdateRowsObject = (item) => {
    const { deletedRows } = this.state
    this.setState({
      deletedRows: {
        ...deletedRows,
        [item.tableId]: {
          ...item,
          highlightColor: 'rgba(180, 0, 0, 0.5)'
        }
      }
    })
  }

  saveChanges = () => {
    const { newRows, editedRows, deletedRows } = this.state
    this.props.saveChanges(newRows, editedRows, deletedRows)
  }

  undoChanges = () => {
    this.setState({
      editCell: {
        headerKey: null,
        rowId: null,
        value: null
      },
      editedRows: {},
      newRows: [],
      deletedRows: {}
    })
  }

  render() {
    const { editCell, editedRows, newRows, deletedRows } = this.state
    const { controls = [] } = this.props

    return (
      <Table
        {...this.props}

        isEditableTable={true}

        editCell={editCell}
        setEditCell={this.setEditCell}
        updateCellValue={this.updateCellValue}

        editedRows={editedRows}
        updateEditedRows={this.updateEditedRows}

        newRows={newRows}

        deletedRows={deletedRows}
        updateDeletedRows={this.updateDeletedRows}

        controls={[
          ...controls,
          {name: 'Delete row', callback: (item) => this.updateDeletedRows(item), hidden: false},
          {name: 'Add row', callback: () => this.addRow()},
          {name: 'Save changes', callback: () => this.saveChanges()},
          {name: 'Undo changes', callback: () => this.undoChanges()}
        ]}
      />
    )
  }
}

