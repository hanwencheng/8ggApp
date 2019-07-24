// @flow
import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Checkbox from '@material-ui/core/Checkbox';
import fs from 'fs';
import os from 'os';
import _ from 'lodash';
import TextField from '@material-ui/core/TextField';
import styles from './Home.css';
import { latitude2Altitude, longitude2Altitude, generateOtherAxisValues, generateOriginAxisValue} from '../../utils/geoCalculator';

const {dialog} = require('electron').remote;

const splitData = (lines) => {
  const dropHead = v => _.drop(v, 1)
  const splitAll = v => _.map(v, line => line.split(",", 2))
  return _.flow(dropHead, splitAll)(lines)
}

const generateOutput = (altitudes, originalLines, shouldReplaceLatitude, otherAxisValues, originAxisValues, shouldConsiderOriginalAltitude, scale) => {
  const updatedLines = _.map(originalLines, (line, i) => {
    if(i === 0){
      return line;
    }
    const newValue = altitudes[i - 1]
    const originalLineValues = line.split(',')
    if(shouldReplaceLatitude){
      originalLineValues[0] = otherAxisValues[i - 1];
      originalLineValues[1] = originAxisValues[i - 1];
    } else {
      originalLineValues[1] = otherAxisValues[i - 1];
      originalLineValues[0] = originAxisValues[i - 1];
    }
    if(shouldConsiderOriginalAltitude) {
      originalLineValues[2] = ((newValue + parseFloat(originalLineValues[2])) * scale).toString()
    } else {
      originalLineValues[2] = newValue;
    }
    
    return originalLineValues.join(',')
  })
  return updatedLines.join('\n');
}

export default function Home(){
  const [shouldReplaceLatitude, setReplaceAxis] = useState(false);
  const [baseHeight, setBaseHeight] = useState(0);
  const [scale, setScale] = useState(1);
  const [fileData, setFileData] = useState('');
  const [outputPath, setOutputPath] = useState(os.homedir());
  const [inputFilePath, setInputFilePath] = useState('')
  const [rotateDegree, setRotateDegree] = useState(0)
  const [shouldConsiderOriginalAltitude, setShouldConsiderOriginalAltitude] = useState(true);
  
  function readFile (){
    dialog.showOpenDialog({
      filters: [
        { name: 'CSV file', extensions: ['csv'] },
      ]
    }, (fileNames) => {
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
        setInputFilePath(fileNames[0]);
        console.log(fileNames[0])
        setFileData(data);
      });
    });
  }
  
  function selectOutputPath() {
    dialog.showOpenDialog({
      title:"Select output folder",
      properties: ["openDirectory"]
    }, (folderPaths) => {
      // folderPaths is an array that contains all the selected paths
      if(folderPaths === undefined){
        console.log("No destination folder selected");
      }else{
        setOutputPath(folderPaths)
      }
    });
  }
  
  function confirmTransformation() {
    const filteredDataLines = _.filter(fileData.split('\n'), line => {
      if(typeof line !== 'string') return false;
      return _.trim(line) !== ''
    })
    const resultData = splitData(filteredDataLines);
    // Change how to handle the file content
    const altitudes = shouldReplaceLatitude ? latitude2Altitude(resultData, baseHeight, scale, rotateDegree) : longitude2Altitude(resultData, baseHeight, scale, rotateDegree);
    const otherAxisValues = generateOtherAxisValues(resultData, scale, rotateDegree, shouldReplaceLatitude);
    const originAxisValues = generateOriginAxisValue(resultData, scale, shouldReplaceLatitude);
    
    const updatedFile = generateOutput(altitudes, filteredDataLines, shouldReplaceLatitude, otherAxisValues, originAxisValues, shouldConsiderOriginalAltitude, scale)
    const outputName = inputFilePath.replace(/^.*[\\\/]/, '').split('.')[0]
    fs.writeFile(`${outputPath}/${outputName}-${new Date().getTime()}.csv`, updatedFile, (err) => {
      if(err){
        alert(`An error ocurred creating the file ${ err.message}`)
      }
    
      alert("The file has been successfully saved");
    });
  }
  
  return (
    <div className={styles.container} data-tid="container">
      <div>
        <FormControl component="fieldset">
          <FormLabel component="legend">Should Flip With Which Axis?</FormLabel>
          <RadioGroup
            row
            aria-label="gender"
            name="gender2"
            value={shouldReplaceLatitude}
            onChange={event => setReplaceAxis(event.target.value === 'true')}
          >
            <FormControlLabel
              value={false}
              control={<Radio color="primary" />}
              label="Longitude"
              labelPlacement="start"
            />
            <FormControlLabel
              value={true}
              control={<Radio color="primary" />}
              label="Latitude"
              labelPlacement="start"
            />
          </RadioGroup>
        </FormControl>
      </div>
  
      {/** <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={shouldConsiderOriginalAltitude}
              onChange={event => setShouldConsiderOriginalAltitude(event.target.checked)}
              color="primary"
            />
          }
          label="Consider Original Altitude "/>
      </div> * */}
  
      <div>
        <TextField
          id="standard-number"
          label="Rotate Degree"
          value={rotateDegree}
          onChange={event => setRotateDegree(parseFloat(event.target.value))}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          margin="normal"
        />
      </div>
      
      <div>
        <TextField
          id="standard-number"
          label="Base Height"
          value={baseHeight}
          onChange={event => setBaseHeight(parseFloat(event.target.value))}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          margin="normal"
        />
      </div>
  
      <div>
        <TextField
          id="standard-number"
          label="Scale"
          value={scale}
          onChange={event => setScale(event.target.value)}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          margin="normal"
        />
      </div>
      
      <div className={styles.buttonContainer}>
        <p className={styles.note}>{inputFilePath === '' ? 'Input path not set' :`Input: ${inputFilePath}`}</p>
        <Button className={styles.button} variant="contained" onClick={()=> readFile()}>Import File</Button>
      </div>
      <div className={styles.buttonContainer}>
        <p className={styles.note}>Path: {outputPath}</p>
        <Button className={styles.button} variant="contained" onClick={()=>selectOutputPath('nothing')}>Set Output Path</Button>
      </div>
  
      <div className={styles.buttonContainer}>
        <Button className={styles.button} variant="contained" onClick={()=>confirmTransformation()}>Confirm</Button>
      </div>
    </div>
  )
}
