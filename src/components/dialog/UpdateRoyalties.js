import React, { useState } from 'react';
import Web3 from 'web3';
import * as math from 'mathjs';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Link, Button, Box, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';

import { REGISTER_CONTRACT_ABI } from '../../abi/registerABI';
import {
  registerContract as CONTRACT_ADDRESS,
  marketContract as MARKET_CONTRACT_ADDRESS,
  blankAddress
} from '../../config';
import TransLoadingButton from '../TransLoadingButton';
import { essentialsConnector } from '../signin-dlg/EssentialConnectivity';
import { TextFieldStyle } from '../CustomInput';
import { removeLeadingZero, isNumberString, reduceHexAddress, isInAppBrowser } from '../../utils/common';

export default function UpdateRoyalties(props) {
  const { isOpen, setOpen, name, token, owners=[], feeRates=[] } = props;
  const originRoyalties = owners.map((address, _i)=>{
    const tempItem = {address, royalties: 0}
    if(feeRates[_i])
      tempItem.royalties = (feeRates[_i]*100/10**6).toString()
    return tempItem
  })
  originRoyalties.push({address: '', royalties: ''})
  const [recipientRoyaltiesGroup, setRecipientRoyaltiesGroup] = React.useState(originRoyalties);
  const [onProgress, setOnProgress] = React.useState(false);
  const [isOnValidation, setOnValidation] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setOpen(false);
  };

  const callChangeRoyalty = async () => {
    const propertiesObj = recipientRoyaltiesGroup.reduce((obj, item) => {
      if(item.address!=='' && item.royalties!=='') {
        obj.owners.push(item.address)
        obj.feeRates.push(item.royalties*10000)
      }
      return obj
    }, {owners: [], feeRates: []})

    const walletConnectProvider = isInAppBrowser() ? window.elastos.getWeb3Provider() : essentialsConnector.getWalletConnectProvider();
    const walletConnectWeb3 = new Web3(walletConnectProvider);
    const accounts = await walletConnectWeb3.eth.getAccounts();
    
    const registerContract = new walletConnectWeb3.eth.Contract(REGISTER_CONTRACT_ABI, CONTRACT_ADDRESS)
    const gasPrice = await walletConnectWeb3.eth.getGasPrice();

    console.log('Sending transaction with account address:', accounts[0]);
    const transactionParams = {
      'from': accounts[0],
      'gasPrice': gasPrice,
      'gas': 5000000,
      'value': 0
    };

    registerContract.methods
      .changeTokenRoyalty(token, propertiesObj.owners, propertiesObj.feeRates)
      .send(transactionParams)
      .on('transactionHash', (hash) => {
        console.log('transactionHash', hash);
      })
      .on('receipt', (receipt) => {
        console.log('receipt', receipt);
        enqueueSnackbar('Update Royalty success!', { variant: 'success' });
        setOpen(false);
        setOnProgress(false);
      })
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log('confirmation', confirmationNumber, receipt);
      })
      .on('error', (error, receipt) => {
        console.error('error', error);
        enqueueSnackbar('Update Royalty error!', { variant: 'error' });
        setOnProgress(false);
      });
  };

  const handleRecipientRoyaltiesGroup = (key, index, e) => {
    let inputValue = e.target.value
    
    if(key==='royalties') {
      if(inputValue.length>0 && !isNumberString(inputValue))
        return
      if(inputValue<0 || inputValue>30)
        return
      inputValue = removeLeadingZero(inputValue)
    }

    const temp = [...recipientRoyaltiesGroup]
    temp[index][key] = inputValue
    if(!temp[index].address.length&&!temp[index].royalties.length){
      if(temp.length>1&&index<temp.length-1)
        temp.splice(index, 1)
      if(temp.findIndex((item)=>(!item.address.length||!item.royalties.length))<0)
        temp.push({address: '', royalties: ''})
    }
    else if(!temp[index].address.length||!temp[index].royalties.length){
      if(!temp[temp.length-1].address.length&&!temp[temp.length-1].royalties.length)
        temp.splice(temp.length-1, 1)
    }
    else if(temp[index].address.length&&temp[index].royalties.length){
      if(temp.findIndex((item)=>(!item.address.length||!item.royalties.length))<0)
        temp.push({address: '', royalties: ''})
    }
    setRecipientRoyaltiesGroup(temp)
  };

  let duproperties = {};
  recipientRoyaltiesGroup.forEach((item,index) => {
    if(!item.address.length) return
    duproperties[item.address] = duproperties[item.address] || [];
    duproperties[item.address].push(index);
  });
  duproperties = Object.keys(duproperties)
    .filter(key => duproperties[key].length>1)
    .reduce((obj, key) => {
      obj.push(key)
      return obj
    }, []);

  const saveRoyalties = async () => {
    setOnValidation(true)
    if(duproperties.length || recipientRoyaltiesGroup.filter(el=>el.address.length>0&&!el.royalties.length).length)
      enqueueSnackbar('Fee recipient properties are invalid.', { variant: 'warning' });
    else if(recipientRoyaltiesGroup.filter(el=>el.address.length%42).length)
      enqueueSnackbar('Fee recipient address is invalid.', { variant: 'warning' });
    else if(recipientRoyaltiesGroup.reduce((sum, el)=>sum+=el.royalties*1, 0)>30)
      enqueueSnackbar('Total royalties must not be more than 30%', { variant: 'warning' });
    else {
      setOnProgress(true);
      callChangeRoyalty();
    }
  };
  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth>
      <DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="h3" component="div" sx={{ color: 'text.primary' }} align="center">
          Collection Royalties
        </Typography>
        <Typography variant="h5" component="div" sx={{ color: 'origin.main', mt: 1 }}>
          Collection Name:{' '}
          <Typography variant="h5" sx={{ display: 'inline', color: 'text.primary' }}>
            {name}
          </Typography>
        </Typography>
        <Typography variant="h4" component="div" sx={{fontWeight: 'normal', py: 1}}>
          Fee Recipient Address & Royalties
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={9}>
            <Typography variant="caption" sx={{display: 'block', pl: '15px', pb: '10px'}}>Fee Recipient Address</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{display: 'block', pl: '15px', pb: '10px'}}>Royalties (%)</Typography>
          </Grid>
        </Grid>
        {
          recipientRoyaltiesGroup.map((item, index)=>{
            const addressErrFlag = isOnValidation && (duproperties.includes(item.address) || item.address.length%42>0)
            let addressErrText = ''
            if(isOnValidation && item.address.length%42)
              addressErrText = 'Not a valid address'
            else if(isOnValidation && duproperties.includes(item.address))
              addressErrText = 'Duplicated address'
            
            return (
              <Grid container spacing={1} key={index} sx={index?{mt: 1}:{}}>
                <Grid item xs={9}>
                  <TextFieldStyle
                    label="Example: 0x012...ABC"
                    size="small"
                    fullWidth
                    inputProps={{ maxLength: 42 }}
                    value={item.address}
                    onChange={(e)=>{handleRecipientRoyaltiesGroup('address', index, e)}}
                    error={addressErrFlag}
                    helperText={addressErrText}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextFieldStyle
                    // type="number"
                    label="Example: 10"
                    size="small"
                    fullWidth
                    value={item.royalties}
                    onChange={(e)=>{handleRecipientRoyaltiesGroup('royalties', index, e)}}
                    error={isOnValidation&&item.address.length>0&&!item.royalties.length}
                    helperText={isOnValidation&&item.address.length>0&&!item.royalties.length?'Can not be empty.':''}
                  />
                </Grid>
              </Grid>
            )
          })
        }
        <Box component="div" sx={{ width: 'fit-content', m: 'auto', py: 2 }}>
          <TransLoadingButton loading={onProgress} onClick={saveRoyalties}>
            Save
          </TransLoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
