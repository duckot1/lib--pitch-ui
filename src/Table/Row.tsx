import React, {Component} from 'react';
import { TableHeader, TableRow, EditCell, UpdateCellValue, UpdateRowsObject, SetEditCell, HighlightRow } from "./Table.types";
import styles from './Table.module.scss';

import { dataTypes } from './data_types.js'

/*====== Components ======*/
import { Button } from '../Button/Button';
import Checkbox from '../Checkbox/Checkbox';

interface TdStyle {
  width: string;
  background?: string;
}

interface RowProps {
  editCell: EditCell;
  item: TableRow;
  headers: TableHeader[];
  updateCellValue?: UpdateCellValue;
  updateEditedRows?: UpdateRowsObject;
  setEditCell?: SetEditCell;
  highlightRow?: HighlightRow;
  highlightedRow?: string;
  isEditableTable?: boolean;
}

export class Row extends Component<RowProps> {

  private cellTextInput: React.RefObject<HTMLInputElement>;

  constructor(props) {
    super(props);
    this.cellTextInput = React.createRef();
  }

  componentDidUpdate(prevProps: RowProps) {
    const { item, editCell } = this.props

    if (editCell && (editCell.rowId !== prevProps.editCell.rowId || editCell.headerKey !== prevProps.editCell.headerKey) && this.cellTextInput.current) {
      this.cellTextInput.current.focus()
    }
  }

  updateText = (value: string) => {
    this.props.updateCellValue(value)
  }

  endEditingTextCell = (header: TableHeader) => {
    const { item, editCell } = this.props
    let value = dataTypes[header.type].parse(editCell.value, header.input)
    header.input.onChange(item, value)
    this.props.updateEditedRows(item, editCell.headerKey, value)
    this.props.setEditCell(null, null, null)
  }

  keyPressed = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      (event.target as HTMLElement).blur()
    }
  }

  renderCells = (header: TableHeader, index: number, headers: TableHeader[]) => {

    let tdStyle: TdStyle = {
      width: header.width ? `${header.width}%` : `${100 / headers.length}%`,
    }

    const { item } = this.props

    if (header.type === 'component' && header.CustomComponent) {
      return (
        <td style={tdStyle}  key={index}>
          <header.CustomComponent item={item} header={header} />
        </td>
      )
    }

    if (item.highlightColor) tdStyle.background = item.highlightColor

    if (header.type === 'color') {
      return (
        <td style={tdStyle}  key={index}>
          <div style={{background: item[header.key]}} className={styles.color}></div>
        </td>
      )
    }

    if (!header.type) header.type = 'text'

    let value = dataTypes[header.type].display(item[header.key])

    if (header.input) {
      const { editCell } = this.props
      if (header.input.type === 'text') {
        return (
          <td
            onDoubleClick={(e) => {
              if (editCell && (item.tableId !== editCell.rowId || header.key !== editCell.headerKey)) {
                this.props.setEditCell(item.tableId, header.key, value)
              }
            }}
            className={styles.inputCell}
            style={tdStyle}
            key={index}
          >
            {!editCell || (item.tableId === editCell.rowId && header.key === editCell.headerKey) ?
              <div className={`${styles.tableInputContainer} ${typeof editCell.value === 'number' ? styles.number : ''} ${typeof editCell.value === 'string' ? styles.text : ''}`}>
                <input ref={this.cellTextInput} type="text" value={editCell.value} className={styles.tableInput} onKeyPress={(e) => this.keyPressed(e)} onBlur={() => {this.endEditingTextCell(header)}} onChange={(e) => this.updateText(e.target.value)}/>
              </div>
              :
              <div className={`${header.type === 'number' ? styles.number : styles.text}`}>
                <div className={styles.tableTextSmall}>{value}</div>
              </div>
            }
          </td>
        )
      } else if (header.input.type === 'select') {
        let selectedOption = header.input.selectOptions.find(option => value === option.value)
        return (
          <td
            onDoubleClick={(e) => {
              if (editCell && item.tableId !== editCell.rowId || header.key !== editCell.headerKey) {
                this.props.setEditCell(item.tableId, header.key, value)
              }
            }}
            className={styles.inputCell}
            style={tdStyle}
            key={index}
          >
            {!editCell || (item.tableId === editCell.rowId && header.key === editCell.headerKey) ?
              <div className={styles.tableInputContainer}>
                <select value={value} className={styles.tableInput} onChange={(e) => {
                  this.props.updateEditedRows(item, header.key, e.target.value)
                  header.input.onChange(item, e.target.value)
                }}>
                  {header.input.selectOptions.map(option => <option value={option.value}>{option.name}</option>)}
                </select>
              </div>
              :
              <div className={`${header.type === 'number' ? styles.number : styles.text}`}>
                <div className={styles.tableTextSmall}>{selectedOption.name}</div>
              </div>
            }
          </td>
        )
      } else if (header.input.type === 'button') {
        return (
          <td style={tdStyle}  key={index}>
            <Button className={'btn--table'} handleClick={() => header.input.callback(item)}>{header.name}</Button>
          </td>
        )
      } else if (header.input.type === 'table') {
        return (
          <td onDoubleClick={(e) => {
            // this.openSelectTable()
          }} style={tdStyle}  key={index}>
            <div className={`${header.type === 'number' ? styles.number : styles.text}`}>
              <div className={styles.tableTextSmall}>{value}</div>
            </div>
          </td>
        )
      } else if (header.input.type === 'checkbox') {
        return (
          <td style={tdStyle} key={index}>
            <div className={styles.center}>
              <Checkbox
                size='small'
                onClicked={(val) => {
                  header.input.onChange(item, val)
                }}
                checked={value}
                input={{value}}/>
            </div>
          </td>
        )
      }
    }

    return (
      <td style={tdStyle}  key={index}>
        <div className={`${header.type === 'number' ? styles.number : styles.text}`}>
          <div className={styles.tableTextSmall}>{value}</div>
        </div>
      </td>
    )
  }

  render() {
    const { item, headers, highlightedRow, editCell } = this.props;
    return (
      <tr
        onClick={(e) => {
          if (this.props.highlightRow) {
            this.props.highlightRow(item.tableId)
          }
          // Remove edit cell if not selected
          if (editCell && item.tableId !== editCell.rowId) {
            this.props.setEditCell(null, null, null)
          }
        }}
        key={item.tableId}
        id={item.tableId}
        className={`${item.tableId && highlightedRow === item.tableId ? styles.highlightRow : ''}`}
      >
        {headers.map((header, index) => {
          return this.renderCells(header, index, headers)
        })}
      </tr>
    )
  }
}