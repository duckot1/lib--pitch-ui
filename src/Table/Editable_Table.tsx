import React, { Component } from 'react'
import { connect } from 'react-redux'
import csv from 'csvtojson'
import { dataTypes } from './data_types'
import * as modalActions from '../Modal/modalActions'

import { Table } from './Table'

import FileInput from '../FileInput/FileInput'
import { Button } from '../Button/Button'

import { TableProps, EditCell, UpdateCellValue, SetEditCell, RowsObject, UpdateRowsObject } from "./Table.types";

interface TableState {
  editCell: EditCell;
  editedRows: RowsObject;
  newRows: RowsObject;
  deletedRows: RowsObject;
  saving: boolean;
  csvFiles: FileList;
}

type CreateRow = (data: RowsObject) => void
type UpdateRow = (data: RowsObject) => Promise<any>
type DeleteRow = (data: RowsObject) => Promise<any>

interface EditableTableProps {
  createRow: CreateRow;
  updateRow: UpdateRow;
  deleteRow: DeleteRow;
  toggleModal: modalActions.ToggleModal;
}

class EditableTable extends Component<TableProps & EditableTableProps, TableState> {

  state: TableState = {
    editCell: {
      headerKey: null,
      rowId: null,
      value: null
    },
    editedRows: {},
    newRows: {},
    deletedRows: {},
    saving: false,
    csvFiles: null
  };

  constructor(props) {
    super(props);

  }

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
    const { editedRows, newRows } = this.state
    if (item[key] === value) return

    if (newRows[item.tableId]) {
      this.setState({
        newRows: {
          ...newRows,
          [item.tableId]: {
            ...item,
            [key]: value
          }
        }
      })
    } else {
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
  }

  addRow = () => {
    // Create new empty row from headers
    const { newRows } = this.state
    const { headers, id } = this.props

    const size = Object.keys(newRows).length;

    let newRow = {
      tableId: `${size}-${id}-new`,
      highlightColor: 'rgba(0, 180, 0, 0.5)',
    }

    headers.forEach(header => {
      newRow[header.key] = header.defaultValue || null
    })

    this.setState({
      newRows: {
        ...newRows,
        [newRow.tableId]: newRow
      }
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

  updateRowState = (responses, type: string) => {
    let rejectedRows = {}
    switch(type) {
      case 'newRows':
        let { [type]: newRows } = this.state
        responses.forEach(response => {
          if (response.status === 'rejected') rejectedRows[response.reason] = newRows[response.reason]
        })
        this.setState({
          newRows: rejectedRows,

        })
        break
      case 'editedRows':
        const { [type]: editedRows } = this.state
        responses.forEach(response => {
          if (response.status === 'rejected') rejectedRows[response.reason] = editedRows[response.reason]
        })
        this.setState({
          editedRows: rejectedRows
        })
        break
      case 'deletedRows':
        const { [type]: deletedRows } = this.state
        responses.forEach(response => {
          if (response.status === 'rejected') rejectedRows[response.reason] = deletedRows[response.reason]
        })
        this.setState({
          deletedRows: rejectedRows
        })
        break
      default:
        break
    }

  }

  saveCurrentRowState = (rowsArray, saveFunction, type, done) => {
    Promise.allSettled(rowsArray.map(row => {

      // Remove table props from row data
      let newRow = {...row}
      const tableId = row.tableId
      delete newRow.tableId
      delete newRow.highlightColor

      return new Promise(function (resolve, reject) {
        if (!saveFunction) reject()
        let promise = saveFunction(newRow)
        if (promise && promise.then) {
          promise.then(response => {
            resolve(tableId)
          }).catch(e => {
            console.log('=======================Unable to save data=====================')
            reject(tableId)
          })
        } else {
          resolve(tableId)
        }
      })
    })).then(response => {
      this.updateRowState(response, type)
      done()
    })
  }

  saveChanges = () => {
    const { newRows, editedRows, deletedRows } = this.state
    let { data, createRow, updateRow, deleteRow } = this.props

    this.setState({saving: true})

    let completed = 0

    const saveCompleted = () => {
      completed++
      if (completed === 3) this.setState({saving: false})
    }

    const newRowsArray = Object.values(newRows)
    this.saveCurrentRowState(newRowsArray, createRow, 'newRows', () => {
      saveCompleted()
    })

    const editedRowsArray = Object.values(editedRows)
    this.saveCurrentRowState(editedRowsArray, updateRow, 'editedRows', () => {
      saveCompleted()
    })

    const deletedRowsArray = Object.values(deletedRows)
    this.saveCurrentRowState(deletedRowsArray, deleteRow, 'deletedRows', () => {
      saveCompleted()
    })
  }

  openImportCSVModal = () => {
    const ChildComponent = ({ handleProceed }) => {
      return (
        <div>
          <FileInput
            name="csvFile"
            label="Select csv file..."
            onChange={(name, files, fileName) => {
              this.setState({
                csvFiles: files
              })
            }}
          />
          <Button handleClick={handleProceed} className={'btn--primary'}>Import</Button>
        </div>
      )
    }
    this.props.toggleModal({
      active: true,
      type: 'confirm',
      handleProceed: () => {
        this.importCSVFile()
        this.props.toggleModal({active: false})
      },
      handleClose: () => {
        this.setState({csvFiles: null})
        this.props.toggleModal({active: false})
      },
      ChildComponent: ChildComponent,
      title: 'Import CSV',
      className: 'modalSmall',
      hideCancel: true,
      wrapper: true
    })
  }

  importCSVFile = () => {

    const { csvFiles } = this.state

    if (!csvFiles) return

    const file = this.state.csvFiles[0]
    if (file) {
      let reader = new FileReader()
      reader.readAsText(file, "UTF-8")
      reader.onload = (evt) => {
        const result: string = typeof evt.target.result === 'string' ? evt.target.result : Buffer.from(evt.target.result).toString()
        csv()
          .fromString(result)
          .then((csvRows) => {
            this.addImportedCSVRows(csvRows)
          })
      }
    }
  }

  addImportedCSVRows = (csvRows) => {
    const { newRows } = this.state
    const { headers, id } = this.props

    let newCSVRows = {}

    csvRows.forEach((csvRow, index) => {
      const size = Object.keys(newRows).length + index + 1;

      let newRow = {
        tableId: `${size}-${id}-new`,
        highlightColor: 'rgba(0, 180, 0, 0.5)',
      }

      headers.forEach(header => {
        console.log(csvRow[header.key])
        if (csvRow[header.key]) {
          newRow[header.key] = dataTypes[header.type].parse(csvRow[header.key])
        } else {
          newRow[header.key] = header.defaultValue || null
        }
      })

      newCSVRows[newRow.tableId] = newRow
    })

    console.log(newRows, newCSVRows)

    this.setState({
      newRows: {
        ...newRows,
        ...newCSVRows
      }
    })
  }

  resetState = () => {
    this.setState({
      editCell: {
        headerKey: null,
        rowId: null,
        value: null
      },
      editedRows: {},
      newRows: {},
      deletedRows: {}
    })
  }

  render() {
    const { editCell, editedRows, newRows, deletedRows, saving } = this.state
    const { controls = [] } = this.props

    return (
      <React.Fragment>
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
            saving ? {name: 'Saving...', callback: () => {}} : {name: 'Save changes', callback: () => this.saveChanges()},
            {name: 'Undo changes', callback: () => this.resetState()},
            {name: 'Delete row', callback: (item) => this.updateDeletedRows(item), hidden: false},
            {name: 'Add row', callback: () => this.addRow()},
            {name: 'Import CSV', callback: () => this.openImportCSVModal()},
            ...controls
          ]}
        />
      </React.Fragment>
    )
  }
}

export default connect(null, modalActions)(EditableTable)



