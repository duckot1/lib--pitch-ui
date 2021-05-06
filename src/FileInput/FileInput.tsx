import React, { Component } from 'react';

import styles from './FileInput.module.scss';

type OnChange = (name: string, files: FileList, fileName: string) => void

interface FileInputProps {
  name: string;
  onChange: OnChange;
  label: string;
}

interface FileInputState {
  fileSelected: boolean;
}

class FileInput extends Component<FileInputProps, FileInputState> {

  constructor(props) {
    super(props)
    this.state = {
      fileSelected: false
    }
  }

  // Callback
  setFile = (e) => {
    const { name } = this.props
    let files = e.target.files
    if (files[0]) {
      this.props.onChange(name, files, `/${files[0].name}`)
    }
  }

  render() {
    const { fileSelected } = this.state
    const { label, name } = this.props
    return (
      <div className={`${styles.narrowFormInput}`}>
        <div className={styles.imgLabel}>
          {label && <label htmlFor={name}>{label}</label>}
        </div>
        <div className={styles.imageUploader}>
          <input style={{display: 'inline-block'}} type="file" id="selectFiles" onChange={this.setFile}  />
          {/* <label className={styles.customFileUpload}>
            <div className={styles.lineOne}/>
            <div className={styles.lineTwo}/>
            <br />
          </label> */}
        </div>
      </div>


    )
  }
}


export default FileInput;
