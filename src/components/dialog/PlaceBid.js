import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import { ethers } from 'ethers';
import * as math from 'mathjs';
import { useWeb3React } from '@web3-react/core';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Button, Box, Grid, Stack, Divider, FormControl, Input, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { PASAR_CONTRACT_ABI } from '../../abi/pasarABI';
import { ERC20_CONTRACT_ABI } from '../../abi/erc20ABI';
import { essentialsConnector } from '../signin-dlg/EssentialConnectivity';
import { walletconnect } from '../signin-dlg/connectors';
import TransLoadingButton from '../TransLoadingButton';
import CoinTypeLabel from '../CoinTypeLabel';
import { InputStyle, InputLabelStyle } from '../CustomInput';
import useSingin from '../../hooks/useSignin';
import useAuctionDlg from '../../hooks/useAuctionDlg';
import { reduceHexAddress, getBalance, getBalanceByAllCoinTypes, callContractMethod, sendIpfsDidJson, isInAppBrowser, getCoinTypesInCurrentNetwork,
  removeLeadingZero, coinTypes, coinTypesForEthereum, isValidLimitPrice, getFilteredGasPrice, getContractAddressInCurrentNetwork, getChainTypeFromId } from '../../utils/common';
import { blankAddress } from '../../config'

export default function PlaceBid(props) {
  const navigate = useNavigate();
  const [balanceArray, setBalanceArray] = useState(Array(coinTypes.length+coinTypesForEthereum.length).fill(0));
  const { enqueueSnackbar } = useSnackbar();
  const [onProgress, setOnProgress] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [isBuynow, setBuynow] = useState(false);

  const context = useWeb3React();
  const { pasarLinkAddress, pasarLinkChain } = useSingin()
  const { updateCount, setUpdateCount } = useAuctionDlg()

  const { library, chainId, account } = context;
  const { isOpen, setOpen, info, coinType={} } = props;

  const chainType = getChainTypeFromId(pasarLinkChain)
  const coinBalance = balanceArray[coinType.index]
  console.log(balanceArray, coinType.index)
  const coinName = coinType.name
  const targetPrice = isBuynow?math.round(info.buyoutPrice / 1e18, 3):bidPrice
  const actionText = isBuynow?"Buy NFT":"Bid NFT"

  const handleClose = () => {
    setOpen(false);
    setBuynow(false)
    setBidPrice('');
  }

  const handleChangeBidPrice = (event) => {
    let priceValue = event.target.value;
    if (priceValue < 0) return;
    priceValue = removeLeadingZero(priceValue);
    if (!isValidLimitPrice(priceValue)) return;
    if(!!(info.buyoutPrice*1) && priceValue>=info.buyoutPrice/1e18)
      setBuynow(true)
    else
      setBuynow(false)
    setBidPrice(priceValue);
  }

  const callEthBidOrder = async (_orderId, _price) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const MarketContractAddress = getContractAddressInCurrentNetwork(pasarLinkChain, 'market')
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const pasarContract = new ethers.Contract(MarketContractAddress, PASAR_CONTRACT_ABI, signer);
        signer.getAddress().then(async userAddress=>{
          if(coinType.address !== blankAddress) {
            const erc20Contract = new ethers.Contract(coinType.address, ERC20_CONTRACT_ABI, signer);
            const erc20BidderApproved = BigInt(await erc20Contract.allowance(userAddress, MarketContractAddress))
            console.log(erc20BidderApproved)
            const _gasPrice = await provider.getGasPrice();
            const gasPrice = getFilteredGasPrice(_gasPrice)
            if(erc20BidderApproved < _price*1){
              console.log('Pasar marketplace not enough ERC20 allowance from bidder');
              const txParams = {
                'from': userAddress,
                'gasPrice': gasPrice,
                'value': 0,
              };
              const approveTxn = await erc20Contract.approve(MarketContractAddress, _price, txParams)
              const erc20BidderApproveStatus = await approveTxn.wait()
              if(!erc20BidderApproveStatus) {
                enqueueSnackbar(`Approve Transaction Error!`, { variant: 'error' });
                setOnProgress(false);
              }
            }
          }
          
          provider.getGasPrice().then(_gasPrice=>{
            const gasPrice = getFilteredGasPrice(_gasPrice)
            const transactionParams = {
              'from': userAddress,
              'gasPrice': gasPrice.toBigInt(),
              'gasLimit': 5000000,
              'value': coinType.address === blankAddress?_price:0
            };
            
            const contractMethod = pasarContract.bidForOrder(_orderId, _price, '', transactionParams)
            // if(isBuynow)
            //   contractMethod = pasarContract.buyOrder(_orderId, '', transactionParams)

            contractMethod.then((nftTxn)=>{
              console.log("Biding... please wait")
              nftTxn.wait().then(()=>{
                // console.log("bought")
                enqueueSnackbar(`${actionText} Success!`, { variant: 'success' });
                setOpen(false);
                setOnProgress(false);
                setTimeout(()=>{
                  // navigate('/profile/myitem/1')
                  setUpdateCount(updateCount+1)
                }, 1000)
              }).catch((error) => {
                console.log(error)
                enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
                setOnProgress(false);
              })
            }).catch((error) => {
              console.log(error)
              enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
              setOnProgress(false);
            })
          }).catch((error) => {
            console.log(error)
            enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
            setOnProgress(false);
          })
        }).catch((error) => {
          console.log(error)
          enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
          setOnProgress(false);
        })
        
      } else {
        console.log("Ethereum object does not exist");
        enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
        setOnProgress(false);
      }
    } catch (err) {
      setOnProgress(false);
      enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
      console.log(err);
    }
  }

  const callBidOrder = async (_orderId, _didUri, _price) => {
    const walletConnectProvider = isInAppBrowser() ? window.elastos.getWeb3Provider() : essentialsConnector.getWalletConnectProvider();
    const walletConnectWeb3 = new Web3(walletConnectProvider);
    const accounts = await walletConnectWeb3.eth.getAccounts();

    const MarketContractAddress = getContractAddressInCurrentNetwork(pasarLinkChain, 'market')
    const pasarContract = new walletConnectWeb3.eth.Contract(PASAR_CONTRACT_ABI, MarketContractAddress);
    if(coinType.address !== blankAddress) {
      const erc20Contract = new walletConnectWeb3.eth.Contract(ERC20_CONTRACT_ABI, coinType.address);
      const erc20BidderApproved = BigInt(await erc20Contract.methods.allowance(accounts[0], MarketContractAddress).call())
      // erc20Contract.methods.allowance(accounts[0], MarketContractAddress).call()
      //   .then(result=>{
      //     const erc20BidderApproved = BigInt(result)
      //   })
      const _gasPrice = await walletConnectWeb3.eth.getGasPrice();
      const gasPrice = getFilteredGasPrice(_gasPrice)
      if(erc20BidderApproved < _price*1){
        console.log('Pasar marketplace not enough ERC20 allowance from bidder');
        const txParams = {
          'from': accounts[0],
          'gasPrice': gasPrice,
          'value': 0,
        };
        const erc20BidderApproveStatus = await erc20Contract.methods.approve(MarketContractAddress, _price).send(txParams)
        if(!erc20BidderApproveStatus) {
          enqueueSnackbar(`Approve Transaction Error!`, { variant: 'error' });
          setOnProgress(false);
        }
      }
    }
    const _gasPrice = await walletConnectWeb3.eth.getGasPrice();
    const gasPrice = getFilteredGasPrice(_gasPrice)
    
    console.log('Sending transaction with account address:', accounts[0]);
    const transactionParams = {
      'from': accounts[0],
      'gasPrice': gasPrice,
      // 'gas': 5000000,
      'value': coinType.address === blankAddress?_price:0
    };
    // console.log(_orderId, _price, _didUri)
    const contractMethod = pasarContract.methods.bidForOrder(_orderId, _price, _didUri)
    // if(isBuynow)
    //   contractMethod = pasarContract.methods.buyOrder(_orderId, _didUri)
    contractMethod.send(transactionParams)
      .on('transactionHash', (hash) => {
        console.log('transactionHash', hash);
      })
      .on('receipt', (receipt) => {
        console.log('receipt', receipt);
        enqueueSnackbar(`${actionText} Success!`, { variant: 'success' });
        setOpen(false);
        setOnProgress(false);
        setTimeout(()=>{
          // navigate('/profile/myitem/1')
          setUpdateCount(updateCount+1)
        }, 1000)
      })
      .on('confirmation', (confirmationNumber, receipt) => {
        // console.log('confirmation', confirmationNumber, receipt);
      })
      .on('error', (error, receipt) => {
        console.error('error', error);
        enqueueSnackbar(`${actionText} Error!`, { variant: 'error' });
        setOnProgress(false);
      });

    // callContractMethod('buyOrder', {'_orderId': _orderId, '_didUri': _didUri})
  };

  const bidNft = async () => {
    if(!bidPrice){
      enqueueSnackbar('Bid amount is required', { variant: 'warning' });
    }
    else if(bidPrice <= info.currentBid/1e18 && info.currentBid){
      enqueueSnackbar('Your Bid amount must be higher than Current Bid', { variant: 'warning' });
    }
    else if(bidPrice < info.Price/1e18){
      enqueueSnackbar('Your Bid amount cannot be lower than Starting Price', { variant: 'warning' });
    }
    else {
      setOnProgress(true);
      const bidPriceStr = BigInt(targetPrice*1e18).toString();
      if(sessionStorage.getItem("PASAR_LINK_ADDRESS") === '1' || sessionStorage.getItem('PASAR_LINK_ADDRESS') === '3') {
        callEthBidOrder(info.OrderId, bidPriceStr);
      }
      else if(sessionStorage.getItem("PASAR_LINK_ADDRESS") === '2') {
        const biderDidUri = await sendIpfsDidJson();
        console.log('didUri:', biderDidUri);
        callBidOrder(info.OrderId, biderDidUri, bidPriceStr);
      }
    }
  };

  const setBalanceByCoinType = (coindex, balance) => {
    setBalanceArray((prevState) => {
      const tempBalance = [...prevState];
      tempBalance[coindex] = balance;
      return tempBalance;
    });
  }
  React.useEffect(async () => {
    const sessionLinkFlag = sessionStorage.getItem('PASAR_LINK_ADDRESS');
    setBalanceArray(Array(coinTypes.length+coinTypesForEthereum.length).fill(0))
    if (sessionLinkFlag) {
      if (sessionLinkFlag === '1' && library)
        getBalanceByAllCoinTypes(library.provider, pasarLinkChain, setBalanceByCoinType)
      else if (sessionLinkFlag === '2'){
        if (isInAppBrowser()) {
          const elastosWeb3Provider = await window.elastos.getWeb3Provider()
          getBalanceByAllCoinTypes(elastosWeb3Provider, pasarLinkChain, setBalanceByCoinType)
        } else if(essentialsConnector.getWalletConnectProvider()) {
          getBalanceByAllCoinTypes(essentialsConnector.getWalletConnectProvider(), pasarLinkChain, setBalanceByCoinType)
        }
      }
      else if (sessionLinkFlag === '3')
        getBalanceByAllCoinTypes(walletconnect.getProvider(), pasarLinkChain, setBalanceByCoinType)
    }
  }, [account, chainId, pasarLinkAddress, pasarLinkChain]);

  const price = Math.max(info.Price / 1e18, targetPrice);
  const platformFee = math.round((price * 2) / 100, 4);
  const royalties = info.SaleType === 'Primary Sale' ? 0 : math.round((price * info.royalties) / 10 ** 6, 4);
  const TypographyStyle = {display: 'inline', lineHeight: 1.1}
  return (
    <Dialog open={isOpen} onClose={handleClose}>
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
        <Typography variant="h3" component="div" sx={{ color: 'text.primary', pb: 1 }} align="center">
          {isBuynow?"Checkout":"Place Bid"}
        </Typography>
        <Typography variant="h6" component="div" sx={{ color: 'text.secondary', lineHeight: 1.1, fontWeight: 'normal', pb: 1 }}>
          You are about to {isBuynow?"purchase":"bid"} <Typography variant="h6" sx={{ ...TypographyStyle, color: 'text.primary' }}>{info.name}</Typography>
          <br />
          from <Typography variant="h6" sx={{ ...TypographyStyle, color: 'text.primary' }}>{reduceHexAddress(info.holder)}</Typography>
          {
            isBuynow&&
            <>
              <br />
              for <Typography variant="h6" sx={{ ...TypographyStyle, color: 'text.primary' }}>{math.round(info.buyoutPrice / 1e18, 3)} {coinName}</Typography>
            </>
          }
        </Typography>
        <Typography variant="h6" sx={{ ...TypographyStyle, color: 'origin.main', fontWeight: 'normal' }}>{info.currentBid?'Current Bid:':'Starting Price:'}</Typography>{' '}
        <Typography variant="h6" sx={{ ...TypographyStyle, color: 'text.primary' }}>
          {math.round((info.currentBid || info.Price) / 1e18, 3)} {coinName}
        </Typography>
        <Grid container sx={{pt: 2, pb: 3}}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 'normal' }}>
              Your Bid
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl variant="standard" sx={{ width: '100%' }}>
              <InputLabelStyle htmlFor="input-with-price">Enter bid amount</InputLabelStyle>
              <InputStyle
                type="number"
                id="input-with-price"
                value={bidPrice}
                onChange={handleChangeBidPrice}
                startAdornment={' '}
                endAdornment={<CoinTypeLabel type={coinType}/>}
              />
            </FormControl>
            <Divider />
            {
              isBuynow&&
              <Typography variant="body2" display="block" color="red" gutterBottom>
                Your bid is equal or higher than the Buy Now price - {math.round(info.buyoutPrice / 1e18, 3)} {coinName}
              </Typography>
            }
          </Grid>
        </Grid>
        <Grid container sx={{display: 'block' }}>
          <Grid item xs={12}>
            <Stack direction="row">
              <Typography variant="body2" display="block" sx={{ flex: 1, mb: 0.5 }}>
                Wallet Balance
              </Typography>
              <Typography
                variant="body2"
                display="block"
                gutterBottom
                align="right"
                sx={{ color: 'text.secondary', mb: 0.5 }}
              >
                {coinBalance} {coinName}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 0.5 }} />
          </Grid>
          {
            !isBuynow&&
            <Grid item xs={12}>
              <Typography variant="body2" display="block" sx={{color: 'origin.main'}}>
                In the case of a successful bid
              </Typography>
            </Grid>
          }
          <Grid item xs={12}>
            <Stack direction="row">
              <Typography variant="body2" display="block" gutterBottom sx={{ flex: 1 }}>
                Platform fee 2%
              </Typography>
              <Typography variant="body2" display="block" gutterBottom align="right" sx={{ color: 'text.secondary' }}>
                {platformFee} {coinName}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row">
              <Typography variant="body2" display="block" gutterBottom sx={{ flex: 1 }}>
                Creator will get (royalties)
              </Typography>
              <Typography variant="body2" display="block" gutterBottom align="right" sx={{ color: 'text.secondary' }}>
                {royalties} {coinName}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row">
              <Typography variant="body2" display="block" gutterBottom sx={{ flex: 1 }}>
                Seller will get
              </Typography>
              <Typography variant="body2" display="block" gutterBottom align="right" sx={{ color: 'text.secondary' }}>
                {price - platformFee - royalties} {coinName}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row">
              <Typography variant="body2" display="block" gutterBottom sx={{ flex: 1, color: 'origin.main' }}>
                You will pay
              </Typography>
              <Typography variant="body2" display="block" gutterBottom align="right">
                {price} {coinName}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        {Math.max(targetPrice, info.Price/1e18) <= coinBalance ? (
          <>
            <Box component="div" sx={{ width: 'fit-content', m: 'auto', py: 2 }}>
              <TransLoadingButton
                loading={onProgress}
                onClick={bidNft}>
                {
                  isBuynow?`Buy Now for ${math.round(info.buyoutPrice / 1e18, 3)} ${coinName}`:'Bid'
                }
              </TransLoadingButton>
            </Box>
            <Typography variant="body2" display="block" color="red" gutterBottom align="center">
              Please check all item details before making a {isBuynow?'purchase':'bid'}
            </Typography>
          </>
        ) : (
          <>
            <Box component="div" sx={{ maxWidth: 200, m: 'auto', py: 2 }}>
              <Button
                variant="outlined"
                href="https://glidefinance.io/swap"
                target="_blank"
                fullWidth
              >
                Add funds
              </Button>
            </Box>
            <Typography variant="body2" display="block" color="red" gutterBottom align="center">
              Insufficient funds in {coinName}
            </Typography>
          </>
        )}
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }} gutterBottom align="center">
          We do not own your private keys and cannot access your funds
          <br />
          without your confirmation.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
