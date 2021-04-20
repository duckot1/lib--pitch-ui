import React, { Component } from 'react'

import { Row } from './Row'

import { TableProps, TableHeader, TableRow, TableControl, HighlightRowCallback } from "./Table.types";

import * as styles from './Table.module.scss'

import _ from 'lodash'

interface TableState {
  filterBy: string;
  order: string;
}

export class Table extends Component<TableProps, TableState> {
  state: TableState = {
    filterBy: '',
    order: '',
  };

  sortData = (data: TableRow[]) => {
    const { filterBy, order } = this.state
    const { id } = this.props
    const { initialSortBy, initialOrder } = this.props.options

    // Assign Table Row IDs
    data = data.map((row, index) => {
      row.tableId = `${index}-${id}`
      return row
    })

    function dec(a: Object, b: Object, key: string): number {
      if(a[key] < b[key]) return 1
      if(a[key] > b[key]) return -1
      return 0;
    }

    function asc(a: Object, b: Object, key: string): number {
      if(a[key] < b[key]) return -1
      if(a[key] > b[key]) return 1
      return 0;
    }

    if (!filterBy || !order) {
      return data.sort((initialOrder === 'dec') ? (a, b) => dec(a, b, initialSortBy) : (a, b) => asc(a, b, initialSortBy))
    }

    return data.sort((order === 'dec') ? (a, b) => dec(a, b, filterBy) : (a, b) => asc(a, b, filterBy))
  }

  sortBy = (key: string) => {
    const { filterBy, order } = this.state
    let state = {}
    if (key === filterBy) {
      if (order === 'asc') state = {order:  'dec'}
      else state = {filterBy: '', order: ''}
    } else {
      state = state = {filterBy: key, order: 'asc'}
    }
    this.setState(state)
  }

  getSelectedRowData = () => {
    let { data, highlightedRow } = this.props
    let rowData = data.find(x => x.tableId === highlightedRow)
    return rowData
  }

  renderHeads = (head: TableHeader, index: number) => {
    const { filterBy, order } = this.state
    const { headers, headerFont, options } = this.props
    return (
      <th style={{width: head.width ? `${head.width}%` : `${100 / headers.length}%`, fontSize: `${headerFont || 15}px`}} onClick={() => {if (options.sortActive) this.sortBy(head.key)}} key={index}>
        <div className={styles.tableHeader}>
          {head.headerColor ?
              <div style={{background: head.headerColor}} className={styles.color}></div>
              :
              <div>{head.type === 'button' ? '' : head.name}</div>
          }
          {filterBy === head.key &&
          <div>
            {order === 'asc' && <div>&#9652;</div>}
            {order === 'dec' && <div>&#9662;</div>}
          </div>
          }
        </div>
      </th>
    )
  }

  renderControl = (option: TableControl, index: number) => {
    if (option.hidden) return <noscript />
    return (
        <button className={`${styles.option} link button`} key={index} onClick={() => {
          let item = this.getSelectedRowData()
          option.callback(item)
        }}>{option.name}</button>
    )
  }

  renderRows = (data: TableRow, index: number) => {
    let { editCell, editedRows, updateEditedRows, isEditableTable, deletedRows } = this.props
    if (isEditableTable && editedRows[data.tableId]) data = editedRows[data.tableId]
    if (isEditableTable && deletedRows[data.tableId]) data = deletedRows[data.tableId]
    return <Row {...this.props} isEditableTable={isEditableTable} updateEditedRows={updateEditedRows} highlightRow={this.props.highlightRow} key={index} item={data} setEditCell={this.props.setEditCell} updateCellValue={this.props.updateCellValue} editCell={editCell}/>
  }

  render() {

    const { data, headers, tableClass, id, controls, className, smallHead, newRows } = this.props

    let sortedData = this.sortData(data);

    if (newRows) sortedData = [...Object.values(newRows), ...sortedData]

    let containerStyle = {
      height: '100%'
    }

    if (controls) {
      containerStyle.height = 'calc(100% - 20px)'
    }

    return (
      <div className={`${styles.container} ${styles[className]}`}>
        {controls &&
        <div className={styles.optionsContainer}>
          {controls.map(this.renderControl)}
        </div>
        }
        <div style={containerStyle} className={styles.tableContainer}>
          <div className={smallHead ? styles.smallHeadContainer : styles.headContainer}>
            <table className={`${styles.tableHead} ${styles[tableClass]}`}>
              <thead>
              <tr>
                {headers.map(this.renderHeads)}
              </tr>
              </thead>
            </table>
          </div>
          <div className={smallHead ? styles.smallHeadOverflow : styles.overflow}>
            <div id={id} className={styles.bodyContainer}>
              <table className={styles[tableClass]}>
                <tbody>
                  {sortedData.map(this.renderRows)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

