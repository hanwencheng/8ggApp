// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import fs from 'fs';
import routes from '../constants/routes';
import styles from './Home.css';
import _ from 'lodash'
import { longitude2Altitude } from '../../utils/geoCalculator';

const {dialog} = require('electron').remote;

type Props = {};

const splitData = (lines) => {
  const filterUnqualifiedLine = v => _.filter(v, line => {
    if(typeof line !== 'string') return false;
    return _.trim(line) !== ''
  })
  const dropHead = v => _.drop(v, 1)
  const splitAll = v => _.map(v, line => line.split(",", 2))
  return _.flow(filterUnqualifiedLine, dropHead, splitAll)(lines)
}

const generateOutput = (altitudes, originalLines, shouldReplaceLatitude) => {
  const updatedLines = _.map(originalLines, (line, i) => {
    if(i === 0){
      return line;
    }
    const newValue = altitudes[i - 1]
    const originalLineValues = line.split(',')
    if(shouldReplaceLatitude){
      originalLineValues[0] = newValue;
    } else {
      originalLineValues[1] = newValue;
    }
    return originalLineValues.join(',')
  })
  console.log('new file is', updatedLines.join('\n'))
  return updatedLines.join('\n');
}

export default class Home extends Component<Props> {
  props: Props;
  
  constructor(props){
    super(props);
    this.state = {
      shouldReplaceLatitude: true,
      baseHeight: 0,
      scale: 1,
    }
  }
  
  readFile (){
    dialog.showOpenDialog((fileNames) => {
      // fileNames is an array that contains all the selected
      if(fileNames === undefined){
        console.log("No file selected");
        return;
      }
      
      fs.readFile(fileNames[0], 'utf-8', (err, data) => {
        if(err){
          alert(`An error ocurred reading the file :${ err.message}`);
          return;
        }
        
        const dataLines = data.split('\n');
        console.log(`The file content is` , dataLines);
        const resultData = splitData(dataLines);
        // Change how to handle the file content
        console.log(`The file content is` , resultData);
        const altitudes = longitude2Altitude(resultData);
        console.log('altitudes are', altitudes);
        generateOutput(altitudes, dataLines, false)
      });
    });
  }
  
  selectPath() {
    dialog.showOpenDialog({
      title:"Select a folder",
      properties: ["openDirectory"]
    }, (folderPaths) => {
      // folderPaths is an array that contains all the selected paths
      if(folderPaths === undefined){
        console.log("No destination folder selected");
      }else{
        console.log(folderPaths);
      }
    });
  }

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <Link to={routes.COUNTER}>to Another Page</Link>
        <div>
          <Button variant="contained" onClick={()=>this.readFile()}>Import File</Button>
        </div>
        <div>
          <Button variant="contained" onClick={()=>this.selectPath('nothing')}>Select Path</Button>
        </div>
      </div>
    );
  }
}
