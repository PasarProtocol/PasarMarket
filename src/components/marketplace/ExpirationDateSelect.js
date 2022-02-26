import React, { useState } from "react";
import {Select, MenuItem, TextField, Dialog, DialogContent, Typography, Stack, Button} from '@mui/material';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import CalendarPicker from '@mui/lab/CalendarPicker';
import { addDays } from 'date-fns';
import PropTypes from 'prop-types';
import {getTime, getDateTimeString, getTimeZone} from '../../utils/common'

const MenuProps = {
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left"
  },
  transformOrigin: {
    vertical: "top",
    horizontal: "left"
  },
  variant: "menu"
}
const menuItems = ['1 day', '3 days', '5 days', '7 days', 'Pick a specific date']
const pickDateIndex = 4
export default function ExpirationDateSelect({ onChangeDate }) {
  const [selected, onChange] = React.useState(0);
  const [dateValue, setDateValue] = useState(new Date());
  const [timeValue, setTimeValue] = useState(`${dateValue.getHours().toString().padStart(2,0)}:${dateValue.getMinutes().toString().padStart(2,0)}`);
  const [isOpenPicker, setOpenPicker] = useState(false)
  const handleChange = (event) => {
    const selectedIndex = event.target.value
    onChange(selectedIndex);
    if(selectedIndex === pickDateIndex)
      onChangeDate(dateValue)
    else
      onChangeDate(addDays(new Date(), 1+selectedIndex*2))
  }
  const handleSpecificPicker = (event) => {
    if(event.target.getAttribute('data-value') === pickDateIndex.toString())
      setOpenPicker(true)
  }
  const renderValue = (option) => {
    if (option === pickDateIndex)
      return <span>{getDateTimeString(dateValue)}</span>;
    return <span>{menuItems[option]}</span>
  }
  const handleSpecificDate = () => {
    setOpenPicker(false)
  }
  const handleDateChange = (newDate) => {
    const splitTime = timeValue.split(':')
    newDate.setHours(splitTime[0])
    newDate.setMinutes(splitTime[1])
    newDate.setSeconds(0)
    setDateValue(newDate)
    onChangeDate(newDate)
  }
  const handleTimeChange = (e) => {
    setTimeValue(e.target.value)
    const splitTime = e.target.value.split(':')
    const tempDate = dateValue
    tempDate.setHours(splitTime[0])
    tempDate.setMinutes(splitTime[1])
    tempDate.setSeconds(0)
    setDateValue(tempDate)
    onChangeDate(tempDate)
  }
  const handleClosePicker = () => {
    setOpenPicker(false)
  }
  return (
    <>
      <Select
        // defaultValue={0}
        variant='standard'
        value={selected}
        onChange={handleChange}
        onClick={handleSpecificPicker}
        inputProps={{ 'aria-label': 'Without label' }}
        size="small"
        sx={{
          mr: 1,
          fontSize: 14,
          width: '100%',
          '& .MuiSelect-select': {
            py: 2
          }
        }}
        renderValue={renderValue}
        MenuProps={MenuProps}
      >
        {
          menuItems.map((type, i)=><MenuItem key={i} value={i} autoFocus={selected===i}>{type}</MenuItem>)
        }
      </Select>
      <Dialog open={isOpenPicker} onClose={handleClosePicker}>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CalendarPicker date={dateValue} onChange={handleDateChange} />
          </LocalizationProvider>
          <Stack direction='row' sx={{mb: 1}}>
            <Typography variant="body2" component="div" sx={{flexGrow: 1}}>
              <Typography variant="h6" sx={{display: 'block'}}>Select time</Typography>
              Your time zone is UTC{getTimeZone()}
            </Typography>
            <TextField
              variant="standard"
              type="time"
              sx={{
                '& input[type="time"]': {
                  p: 1
                },
                '& input[type="time"]::-webkit-calendar-picker-indicator': {
                  cursor: 'pointer',
                  p: 1,
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.grey[400],
                  borderRadius: '100%'
                },
                '& input[type="time"]::-webkit-calendar-picker-indicator:hover': {
                  borderColor: (theme) => theme.palette.grey[500]
                },
                '& :before, & :after': {display: 'none'},
              }}
              value={timeValue}
              onChange={handleTimeChange}
            />
          </Stack>
          <Button variant="contained" onClick={handleSpecificDate} fullWidth>
            Apply
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

ExpirationDateSelect.propTypes = {
  onChange: PropTypes.func,
}